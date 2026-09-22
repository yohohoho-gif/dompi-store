-- ====================================================================
-- DOMPI Admin Authentication & Authorization Schema
-- Version: 20260922000003
-- Idempotent & Non-destructive: No DROP, DELETE, or TRUNCATE statements
-- ====================================================================

-- 1. Create admin_users table referencing auth.users
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for instant lookup by user id
CREATE INDEX IF NOT EXISTS idx_admin_users_id ON public.admin_users(id);

-- Automatic updated_at trigger
CREATE OR REPLACE TRIGGER set_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Fast SECURITY DEFINER function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR ADMINS
-- ====================================================================

-- 1. Policy on admin_users: Authenticated admins can view admin_users
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_users' AND policyname = 'Admins can view admin users'
  ) THEN
    CREATE POLICY "Admins can view admin users"
      ON public.admin_users FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- 2. Policy on products: Admins can read all products (including inactive/drafts)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Admins can read all products'
  ) THEN
    CREATE POLICY "Admins can read all products"
      ON public.products FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- 3. Policy on products: Admins can insert, update, and delete products
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Admins can manage products'
  ) THEN
    CREATE POLICY "Admins can manage products"
      ON public.products FOR ALL
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;

-- 4. Policy on categories: Admins can insert, update, and delete categories
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Admins can manage categories'
  ) THEN
    CREATE POLICY "Admins can manage categories"
      ON public.categories FOR ALL
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;

-- 5. Policy on product_images: Admins can insert, update, and delete product images
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_images' AND policyname = 'Admins can manage product images'
  ) THEN
    CREATE POLICY "Admins can manage product images"
      ON public.product_images FOR ALL
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;

-- 6. Policy on product_variants: Admins can insert, update, and delete product variants
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_variants' AND policyname = 'Admins can manage product variants'
  ) THEN
    CREATE POLICY "Admins can manage product variants"
      ON public.product_variants FOR ALL
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;
