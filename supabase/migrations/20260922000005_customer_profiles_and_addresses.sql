-- ====================================================================
-- DOMPI Customer Account Phase 2: Profiles & Addresses Migration
-- Version: 20260922000005
-- Tables: public.customer_profiles, public.customer_addresses
-- Security: Strict RLS (auth.uid() = user_id), isolated search_path,
--           hardened SECURITY DEFINER functions, atomic default address management
-- Idempotent & Non-destructive: Safe to run once approved
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. CUSTOMER PROFILES TABLE (1:1 with auth.users)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NULL,
  phone TEXT NULL CHECK (phone IS NULL OR phone ~ '^[0-9+() -]{7,25}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Note: No redundant idx_customer_profiles_id created.
-- Primary key 'id' automatically generates customer_profiles_pkey unique B-tree index.

-- Automatic updated_at trigger for customer_profiles
CREATE OR REPLACE TRIGGER set_customer_profiles_updated_at
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- --------------------------------------------------------------------
-- 2. CUSTOMER ADDRESSES TABLE (1:N with auth.users)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL CHECK (char_length(trim(recipient_name)) >= 2),
  phone TEXT NOT NULL CHECK (phone ~ '^[0-9+() -]{7,25}$'),
  address_line TEXT NOT NULL CHECK (char_length(trim(address_line)) >= 5),
  subdistrict TEXT NOT NULL CHECK (char_length(trim(subdistrict)) >= 2),
  district TEXT NOT NULL CHECK (char_length(trim(district)) >= 2),
  province TEXT NOT NULL CHECK (char_length(trim(province)) >= 2),
  postal_code TEXT NOT NULL CHECK (postal_code ~ '^[0-9]{5}$'),
  label TEXT NOT NULL DEFAULT 'Home' CHECK (label IN ('Home', 'Work', 'Other')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Automatic updated_at trigger for customer_addresses
CREATE OR REPLACE TRIGGER set_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- --------------------------------------------------------------------
-- 3. INDEXES FOR CUSTOMER ADDRESSES
-- --------------------------------------------------------------------
-- B-tree index for filtering addresses by customer
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id
  ON public.customer_addresses(user_id);

-- Partial Unique Index: Guarantees at most ONE default address per customer
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_addresses_single_default
  ON public.customer_addresses (user_id)
  WHERE (is_default = true);

-- --------------------------------------------------------------------
-- 4. HARDENED TRIGGER: auth.users -> public.customer_profiles
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_full_name TEXT;
BEGIN
  -- Extract real full_name from metadata without fabricated placeholders
  v_full_name := NULLIF(trim(COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name'
  )), '');

  INSERT INTO public.customer_profiles (id, full_name, created_at, updated_at)
  VALUES (NEW.id, v_full_name, now(), now())
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name
  WHERE customer_profiles.full_name IS NULL AND EXCLUDED.full_name IS NOT NULL;

  RETURN NEW;
END;
$$;

-- Restrict execution privilege on trigger function
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------------------
-- 5. ONE-TIME PROFILE BACKFILL FOR EXISTING USERS
-- --------------------------------------------------------------------
INSERT INTO public.customer_profiles (id, full_name, created_at, updated_at)
SELECT
  id,
  NULLIF(trim(COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name'
  )), ''),
  created_at,
  now()
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------
-- 6. ATOMIC DEFAULT-ADDRESS RPC FUNCTION
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_default_customer_address(p_address_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  -- Verify address exists and belongs to the authenticated user
  IF NOT EXISTS (
    SELECT 1 FROM public.customer_addresses
    WHERE id = p_address_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Address not found or unauthorized' USING ERRCODE = 'P0002';
  END IF;

  -- Atomic update inside single transaction:
  -- Clear existing default and promote selected address
  UPDATE public.customer_addresses
  SET is_default = false
  WHERE user_id = v_user_id AND is_default = true;

  UPDATE public.customer_addresses
  SET is_default = true, updated_at = now()
  WHERE id = p_address_id AND user_id = v_user_id;
END;
$$;

-- Privileges: revoke from public, grant strictly to authenticated
REVOKE EXECUTE ON FUNCTION public.set_default_customer_address(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_default_customer_address(UUID) TO authenticated;

-- --------------------------------------------------------------------
-- 7. DEFAULT-ADDRESS LIFECYCLE TRIGGER (First Address & Demotion)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_customer_address_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Prevent recursion
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Count existing addresses for this user (excluding current row on update)
  SELECT COUNT(*) INTO v_count
  FROM public.customer_addresses
  WHERE user_id = NEW.user_id AND (TG_OP = 'INSERT' OR id != NEW.id);

  -- Rule 1: First address created for a customer must always become default
  IF v_count = 0 THEN
    NEW.is_default := true;
  ELSIF NEW.is_default = true THEN
    -- Rule 2: If a new address is marked as default, atomically demote previous default
    UPDATE public.customer_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND is_default = true AND (TG_OP = 'INSERT' OR id != NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_customer_address_lifecycle() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_customer_address_lifecycle ON public.customer_addresses;
CREATE TRIGGER trg_customer_address_lifecycle
  BEFORE INSERT OR UPDATE OF is_default ON public.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_customer_address_lifecycle();

-- --------------------------------------------------------------------
-- 8. DEFAULT-ADDRESS DELETION AUTO-PROMOTION TRIGGER
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_customer_address_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_next_id UUID;
BEGIN
  -- Prevent recursion
  IF pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;

  -- If the deleted address was the default, auto-promote the most recently active remaining address
  IF OLD.is_default = true THEN
    SELECT id INTO v_next_id
    FROM public.customer_addresses
    WHERE user_id = OLD.user_id AND id != OLD.id
    ORDER BY updated_at DESC, created_at DESC
    LIMIT 1;

    IF v_next_id IS NOT NULL THEN
      UPDATE public.customer_addresses
      SET is_default = true, updated_at = now()
      WHERE id = v_next_id;
    END IF;
  END IF;

  RETURN OLD;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_customer_address_deletion() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_customer_address_deletion ON public.customer_addresses;
CREATE TRIGGER trg_customer_address_deletion
  AFTER DELETE ON public.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_customer_address_deletion();

-- --------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Customer Profiles RLS (SELECT, UPDATE only; DELETE prohibited)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_profiles' AND policyname = 'Customers can view own profile'
  ) THEN
    CREATE POLICY "Customers can view own profile"
      ON public.customer_profiles FOR SELECT
      TO authenticated
      USING (id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_profiles' AND policyname = 'Customers can update own profile'
  ) THEN
    CREATE POLICY "Customers can update own profile"
      ON public.customer_profiles FOR UPDATE
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- Customer Addresses RLS (Full CRUD strictly scoped to auth.uid() = user_id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_addresses' AND policyname = 'Customers can view own addresses'
  ) THEN
    CREATE POLICY "Customers can view own addresses"
      ON public.customer_addresses FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_addresses' AND policyname = 'Customers can insert own addresses'
  ) THEN
    CREATE POLICY "Customers can insert own addresses"
      ON public.customer_addresses FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_addresses' AND policyname = 'Customers can update own addresses'
  ) THEN
    CREATE POLICY "Customers can update own addresses"
      ON public.customer_addresses FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_addresses' AND policyname = 'Customers can delete own addresses'
  ) THEN
    CREATE POLICY "Customers can delete own addresses"
      ON public.customer_addresses FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;
