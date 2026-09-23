-- ====================================================================
-- DOMPI Phase C2 — Secure Order Database Foundation Migration
-- Version: 20260924000001
-- Tables Altered: public.orders, public.order_items
-- Functions: public.generate_order_number, public.create_order_secure
-- Security: Revokes public writes, establishes customer & admin RLS,
--           hardened SECURITY DEFINER transactional RPC with deterministic
--           row-level variant locking (deadlock prevention), atomic stock
--           deduction, server-authoritative pricing, and idempotency protection.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. ORDERS TABLE ALTERATIONS
-- --------------------------------------------------------------------

-- Add user_id referencing auth.users (nullable for guest checkout, SET NULL on user deletion)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add payment_status with default 'awaiting_payment'
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'awaiting_payment';

-- Add payment_method with default 'bank_transfer'
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'bank_transfer';

-- Add currency with default 'THB'
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'THB';

-- Add idempotency_key (nullable to preserve compatibility with existing historical rows)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key UUID NULL;

-- --------------------------------------------------------------------
-- 2. STATUS & FIELD CHECK CONSTRAINTS (MIGRATION SAFETY CHECK)
-- --------------------------------------------------------------------

-- Verify existing rows for invalid or NULL status values before applying CHECK constraint
DO $$
DECLARE
  v_invalid_count INT;
BEGIN
  SELECT count(*) INTO v_invalid_count
  FROM public.orders
  WHERE status IS NULL OR status NOT IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

  IF v_invalid_count > 0 THEN
    RAISE EXCEPTION 'Cannot add CHECK constraint on orders.status: found % rows with invalid status', v_invalid_count;
  END IF;
END $$;

-- Enforce allowed fulfillment statuses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_status_check
      CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled'));
  END IF;
END $$;

-- Enforce allowed payment statuses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_status_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_status_check
      CHECK (payment_status IN ('awaiting_payment', 'paid', 'failed', 'refunded'));
  END IF;
END $$;

-- Enforce allowed payment methods
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_method_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_method_check
      CHECK (payment_method IN ('bank_transfer', 'promptpay'));
  END IF;
END $$;

-- Enforce currency
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_currency_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_currency_check
      CHECK (currency = 'THB');
  END IF;
END $$;

-- Enforce uniqueness on idempotency_key (allows multiple NULLs for historical rows)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_idempotency_key_key'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_idempotency_key_key
      UNIQUE (idempotency_key);
  END IF;
END $$;

-- --------------------------------------------------------------------
-- 3. ORDERS INDEXES
-- --------------------------------------------------------------------

-- Partial index for customer account order lookups (skips guest orders where user_id IS NULL)
CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON public.orders(user_id)
  WHERE user_id IS NOT NULL;

-- Index for payment verification and order status management
CREATE INDEX IF NOT EXISTS idx_orders_payment_status
  ON public.orders(payment_status);

-- Index for chronological order sorting (latest first)
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON public.orders(created_at DESC);

-- Note: idx_orders_order_number and idx_orders_status already exist from 20260922000001_initial_schema.sql.
-- Redundant duplicates are intentionally avoided.

-- --------------------------------------------------------------------
-- 4. ORDER_ITEMS TABLE ALTERATIONS
-- --------------------------------------------------------------------

-- Add variant_id linking to public.product_variants
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant_id UUID NULL REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- Add product_image snapshot URL
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS product_image TEXT NULL;

-- Note on product_price: The existing column 'product_price NUMERIC(10, 2)' is retained
-- as the authoritative unit-price snapshot for backwards compatibility.
-- Note on sku: Speculative sku column omitted until catalog variants model supports SKU.

-- Index for variant traceability
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id
  ON public.order_items(variant_id);

-- --------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) & PRIVILEGE HARDENING
-- --------------------------------------------------------------------

-- Drop unsafe direct public INSERT policies from initial schema
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;

-- Revoke direct table write privileges from anonymous guests (defense-in-depth)
REVOKE INSERT, UPDATE, DELETE ON public.orders FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.order_items FROM anon;

-- Revoke direct table INSERT from authenticated users (all order creations must use RPC)
REVOKE INSERT ON public.orders FROM authenticated;
REVOKE INSERT ON public.order_items FROM authenticated;

-- Customer Read Policies (Authenticated customers can view only their own orders)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Customers can view own orders'
  ) THEN
    CREATE POLICY "Customers can view own orders"
      ON public.orders FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Customers can view own order items'
  ) THEN
    CREATE POLICY "Customers can view own order items"
      ON public.order_items FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = order_items.order_id
            AND o.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Admin Full Access Policies (Governed by public.is_admin())
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Admins can view all orders'
  ) THEN
    CREATE POLICY "Admins can view all orders"
      ON public.orders FOR SELECT
      TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Admins can update orders'
  ) THEN
    CREATE POLICY "Admins can update orders"
      ON public.orders FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Admins can delete orders'
  ) THEN
    CREATE POLICY "Admins can delete orders"
      ON public.orders FOR DELETE
      TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Admins can view all order items'
  ) THEN
    CREATE POLICY "Admins can view all order items"
      ON public.order_items FOR SELECT
      TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Admins can update order items'
  ) THEN
    CREATE POLICY "Admins can update order items"
      ON public.order_items FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Admins can delete order items'
  ) THEN
    CREATE POLICY "Admins can delete order items"
      ON public.order_items FOR DELETE
      TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- --------------------------------------------------------------------
-- 6. ORDER NUMBER GENERATION FUNCTION
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_date_part TEXT;
  v_random_part TEXT;
BEGIN
  -- Date in Bangkok timezone (YYYYMMDD)
  v_date_part := to_char(now() AT TIME ZONE 'Asia/Bangkok', 'YYYYMMDD');
  -- 8 uppercase alphanumeric characters derived from native gen_random_uuid() (32 bits of entropy)
  v_random_part := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  RETURN 'DMP-' || v_date_part || '-' || v_random_part;
END;
$$;

-- Revoke direct execution of order number generator from public/anon/authenticated
-- (Internal helper invoked only by create_order_secure)
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM PUBLIC, anon, authenticated;

-- --------------------------------------------------------------------
-- 7. SECURE ORDER CREATION RPC (TRANSACTION-SAFE & IDEMPOTENT)
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_order_secure(
  p_items JSONB,
  p_contact JSONB,
  p_shipping_address JSONB,
  p_payment_method TEXT,
  p_idempotency_key UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_order_id UUID;
  v_order_number TEXT;
  v_subtotal NUMERIC(10, 2) := 0.00;
  v_shipping_fee NUMERIC(10, 2) := 0.00;
  v_total NUMERIC(10, 2) := 0.00;

  -- Normalized Contact Fields
  v_contact_name TEXT;
  v_contact_email TEXT;
  v_contact_phone TEXT;

  -- Normalized Shipping Fields
  v_shipping_recipient TEXT;
  v_shipping_phone TEXT;
  v_shipping_address_line TEXT;
  v_shipping_subdistrict TEXT;
  v_shipping_district TEXT;
  v_shipping_province TEXT;
  v_shipping_postal_code TEXT;
  v_shipping_country TEXT;
  v_shipping_snapshot JSONB;

  -- Idempotency & Loops
  v_existing_order RECORD;
  v_items_count INT;
  v_duplicate_count INT;
  v_attempt INT;
  v_item RECORD;
  v_variant RECORD;
  v_product_image TEXT;
  v_line_subtotal NUMERIC(10, 2);
BEGIN
  -- ==================================================================
  -- 1. IDENTIFY CALLER CONTEXT
  -- ==================================================================
  -- Derives auth.uid() automatically; NULL for guest checkout.
  v_user_id := auth.uid();

  -- ==================================================================
  -- 2. STRICT INPUT VALIDATION (DEFENSE IN DEPTH)
  -- ==================================================================

  -- 2a. Idempotency Key Validation
  IF p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'INVALID_INPUT: Missing or invalid idempotency key';
  END IF;

  -- 2b. Items Array Validation
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'INVALID_INPUT: Items must be a JSON array';
  END IF;

  v_items_count := jsonb_array_length(p_items);
  IF v_items_count < 1 OR v_items_count > 50 THEN
    RAISE EXCEPTION 'INVALID_INPUT: Item count must be between 1 and 50 lines';
  END IF;

  -- 2c. Contact Object Validation
  IF p_contact IS NULL OR jsonb_typeof(p_contact) <> 'object' THEN
    RAISE EXCEPTION 'INVALID_INPUT: Contact information must be a JSON object';
  END IF;

  -- 2d. Shipping Address Object Validation
  IF p_shipping_address IS NULL OR jsonb_typeof(p_shipping_address) <> 'object' THEN
    RAISE EXCEPTION 'INVALID_INPUT: Shipping address must be a JSON object';
  END IF;

  -- 2e. Payment Method Validation
  IF p_payment_method IS NULL OR p_payment_method NOT IN ('bank_transfer', 'promptpay') THEN
    RAISE EXCEPTION 'UNSUPPORTED_PAYMENT_METHOD: Payment method must be bank_transfer or promptpay';
  END IF;

  -- 2f. Contact Information Validation (Explicit NULL-safety guards against SQL 3-valued logic)
  v_contact_name := trim(p_contact->>'name');
  v_contact_email := lower(trim(p_contact->>'email'));
  v_contact_phone := trim(p_contact->>'phone');

  IF v_contact_name IS NULL OR char_length(v_contact_name) < 2 OR char_length(v_contact_name) > 100 THEN
    RAISE EXCEPTION 'INVALID_INPUT: Contact name must be between 2 and 100 characters';
  END IF;

  IF v_contact_email IS NULL OR v_contact_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR char_length(v_contact_email) > 255 THEN
    RAISE EXCEPTION 'INVALID_INPUT: Invalid contact email format';
  END IF;

  IF v_contact_phone IS NULL OR v_contact_phone !~ '^[0-9+() -]{7,25}$' THEN
    RAISE EXCEPTION 'INVALID_INPUT: Invalid contact phone number';
  END IF;

  -- 2g. Shipping Address Validation (Explicit NULL-safety guards against SQL 3-valued logic)
  v_shipping_recipient := trim(p_shipping_address->>'recipient_name');
  v_shipping_phone := trim(p_shipping_address->>'phone');
  v_shipping_address_line := trim(p_shipping_address->>'address_line');
  v_shipping_subdistrict := trim(p_shipping_address->>'subdistrict');
  v_shipping_district := trim(p_shipping_address->>'district');
  v_shipping_province := trim(p_shipping_address->>'province');
  v_shipping_postal_code := trim(p_shipping_address->>'postal_code');
  v_shipping_country := upper(trim(coalesce(p_shipping_address->>'country', 'TH')));

  IF v_shipping_recipient IS NULL OR char_length(v_shipping_recipient) < 2 OR char_length(v_shipping_recipient) > 100 THEN
    RAISE EXCEPTION 'INVALID_INPUT: Shipping recipient name must be between 2 and 100 characters';
  END IF;

  IF v_shipping_phone IS NULL OR v_shipping_phone !~ '^[0-9+() -]{7,25}$' THEN
    RAISE EXCEPTION 'INVALID_INPUT: Invalid shipping phone number';
  END IF;

  IF v_shipping_address_line IS NULL OR char_length(v_shipping_address_line) < 5 OR char_length(v_shipping_address_line) > 255 THEN
    RAISE EXCEPTION 'INVALID_INPUT: Shipping address line must be between 5 and 255 characters';
  END IF;

  IF v_shipping_subdistrict IS NULL OR char_length(v_shipping_subdistrict) < 2 OR char_length(v_shipping_subdistrict) > 100 THEN
    RAISE EXCEPTION 'INVALID_INPUT: Shipping subdistrict must be between 2 and 100 characters';
  END IF;

  IF v_shipping_district IS NULL OR char_length(v_shipping_district) < 2 OR char_length(v_shipping_district) > 100 THEN
    RAISE EXCEPTION 'INVALID_INPUT: Shipping district must be between 2 and 100 characters';
  END IF;

  IF v_shipping_province IS NULL OR char_length(v_shipping_province) < 2 OR char_length(v_shipping_province) > 100 THEN
    RAISE EXCEPTION 'INVALID_INPUT: Shipping province must be between 2 and 100 characters';
  END IF;

  IF v_shipping_postal_code IS NULL OR v_shipping_postal_code !~ '^[0-9]{5}$' THEN
    RAISE EXCEPTION 'INVALID_INPUT: Postal code must be exactly 5 digits';
  END IF;

  IF v_shipping_country IS NULL OR v_shipping_country <> 'TH' THEN
    RAISE EXCEPTION 'INVALID_INPUT: Shipping country must be TH';
  END IF;

  -- Build immutable canonical shipping snapshot (whitelisted keys only)
  v_shipping_snapshot := jsonb_build_object(
    'recipient_name', v_shipping_recipient,
    'phone', v_shipping_phone,
    'address_line', v_shipping_address_line,
    'subdistrict', v_shipping_subdistrict,
    'district', v_shipping_district,
    'province', v_shipping_province,
    'postal_code', v_shipping_postal_code,
    'country', 'TH'
  );

  -- ==================================================================
  -- 3. IDEMPOTENCY CHECK & OWNERSHIP VERIFICATION
  -- ==================================================================
  SELECT id, order_number, total, subtotal, shipping_fee, currency, user_id, email
  INTO v_existing_order
  FROM public.orders
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    -- Prevent unauthorized users from querying existing orders via guessed idempotency keys
    IF v_user_id IS NOT NULL THEN
      IF v_existing_order.user_id IS DISTINCT FROM v_user_id THEN
        RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSED: Key belongs to another customer';
      END IF;
    ELSE
      IF lower(trim(v_existing_order.email)) <> v_contact_email THEN
        RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSED: Key belongs to another customer';
      END IF;
    END IF;

    -- Return cached order without mutating stock or creating duplicates
    RETURN jsonb_build_object(
      'order_id', v_existing_order.id,
      'order_number', v_existing_order.order_number,
      'total', v_existing_order.total,
      'subtotal', v_existing_order.subtotal,
      'shipping_fee', v_existing_order.shipping_fee,
      'currency', v_existing_order.currency,
      'is_idempotent_replay', true
    );
  END IF;

  -- ==================================================================
  -- 4. VALIDATE ITEMS STRUCTURE & DUPLICATES
  -- ==================================================================
  FOR v_item IN
    SELECT trim(elem->>'variant_id') AS variant_id_str,
           trim(elem->>'quantity') AS quantity_str
    FROM jsonb_array_elements(p_items) AS elem
  LOOP
    -- Strict canonical UUID 8-4-4-4-12 pattern
    IF v_item.variant_id_str IS NULL OR v_item.variant_id_str !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
      RAISE EXCEPTION 'INVALID_ITEM: Missing or malformed variant_id';
    END IF;

    -- Strict integer pattern and length guard against 32-bit integer overflow (max 2 digits for 1..20)
    IF v_item.quantity_str IS NULL OR v_item.quantity_str !~ '^[0-9]+$' OR char_length(v_item.quantity_str) > 2 THEN
      RAISE EXCEPTION 'INVALID_ITEM: Quantity must be a positive integer between 1 and 20';
    END IF;

    IF (v_item.quantity_str)::INT < 1 OR (v_item.quantity_str)::INT > 20 THEN
      RAISE EXCEPTION 'INVALID_ITEM: Quantity must be between 1 and 20 per item';
    END IF;
  END LOOP;

  -- Safe duplicate variant detection using normalized text (no raw UUID cast required)
  SELECT count(*) INTO v_duplicate_count
  FROM (
    SELECT lower(trim(elem->>'variant_id')) AS vid
    FROM jsonb_array_elements(p_items) elem
    GROUP BY lower(trim(elem->>'variant_id'))
    HAVING count(*) > 1
  ) dupes;

  IF v_duplicate_count > 0 THEN
    RAISE EXCEPTION 'DUPLICATE_VARIANT: Variant appears multiple times in items payload';
  END IF;

  -- ==================================================================
  -- 5. DETERMINISTIC ROW-LEVEL LOCKING (DEADLOCK PREVENTED)
  -- ==================================================================
  -- Lock variant rows in strict ascending order of UUID
  PERFORM 1
  FROM public.product_variants
  WHERE id IN (
    SELECT (trim(elem->>'variant_id'))::UUID
    FROM jsonb_array_elements(p_items) elem
  )
  ORDER BY id ASC
  FOR UPDATE;

  -- ==================================================================
  -- 6. PRODUCT / VARIANT VALIDATION & AUTHORITATIVE PRICE CALCULATION
  -- ==================================================================
  FOR v_item IN
    SELECT (trim(elem->>'variant_id'))::UUID AS variant_id,
           (trim(elem->>'quantity'))::INT AS quantity
    FROM jsonb_array_elements(p_items) elem
    ORDER BY (trim(elem->>'variant_id'))::UUID ASC
  LOOP
    SELECT v.id AS variant_id,
           v.product_id,
           v.color,
           v.size,
           v.stock,
           p.name AS product_name,
           p.price AS product_price,
           p.is_active
    INTO v_variant
    FROM public.product_variants v
    JOIN public.products p ON p.id = v.product_id
    WHERE v.id = v_item.variant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND: Variant % does not exist', v_item.variant_id;
    END IF;

    IF NOT v_variant.is_active THEN
      RAISE EXCEPTION 'PRODUCT_UNAVAILABLE: Product % is currently inactive', v_variant.product_name;
    END IF;

    IF v_variant.stock < v_item.quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK: Only % remaining in stock for % (%/%)',
        v_variant.stock, v_variant.product_name, v_variant.color, v_variant.size;
    END IF;

    -- Authoritative line subtotal calculation
    v_line_subtotal := v_variant.product_price * v_item.quantity;
    v_subtotal := v_subtotal + v_line_subtotal;
  END LOOP;

  -- ==================================================================
  -- 7. AUTHORITATIVE SHIPPING FEE & TOTAL
  -- ==================================================================
  -- Free shipping at >= 2,000 THB; otherwise 100 THB
  IF v_subtotal >= 2000.00 THEN
    v_shipping_fee := 0.00;
  ELSE
    v_shipping_fee := 100.00;
  END IF;

  v_total := v_subtotal + v_shipping_fee;

  -- ==================================================================
  -- 8. GENERATE ORDER NUMBER & INSERT ORDER (WITH COLLISION RETRY)
  -- ==================================================================
  FOR v_attempt IN 1..5 LOOP
    BEGIN
      v_order_number := public.generate_order_number();

      INSERT INTO public.orders (
        order_number,
        user_id,
        status,
        payment_status,
        payment_method,
        currency,
        customer_name,
        email,
        phone,
        shipping_address,
        subtotal,
        shipping_fee,
        total,
        idempotency_key
      ) VALUES (
        v_order_number,
        v_user_id,
        'pending',
        'awaiting_payment',
        p_payment_method,
        'THB',
        v_contact_name,
        v_contact_email,
        v_contact_phone,
        v_shipping_snapshot,
        v_subtotal,
        v_shipping_fee,
        v_total,
        p_idempotency_key
      ) RETURNING id INTO v_order_id;

      EXIT; -- Insertion succeeded; exit retry loop
    EXCEPTION
      WHEN unique_violation THEN
        -- Handle concurrent race condition on idempotency_key
        SELECT id, order_number, total, subtotal, shipping_fee, currency, user_id, email
        INTO v_existing_order
        FROM public.orders
        WHERE idempotency_key = p_idempotency_key;

        IF FOUND THEN
          IF v_user_id IS NOT NULL AND v_existing_order.user_id IS DISTINCT FROM v_user_id THEN
            RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSED: Key belongs to another customer';
          END IF;
          IF v_user_id IS NULL AND lower(trim(v_existing_order.email)) <> v_contact_email THEN
            RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSED: Key belongs to another customer';
          END IF;

          RETURN jsonb_build_object(
            'order_id', v_existing_order.id,
            'order_number', v_existing_order.order_number,
            'total', v_existing_order.total,
            'subtotal', v_existing_order.subtotal,
            'shipping_fee', v_existing_order.shipping_fee,
            'currency', v_existing_order.currency,
            'is_idempotent_replay', true
          );
        END IF;

        IF v_attempt = 5 THEN
          RAISE EXCEPTION 'ORDER_NUMBER_GENERATION_FAILED: Failed to allocate unique order number';
        END IF;
    END;
  END LOOP;

  -- ==================================================================
  -- 9. INSERT ORDER ITEMS & DECREMENT STOCK
  -- ==================================================================
  FOR v_item IN
    SELECT (trim(elem->>'variant_id'))::UUID AS variant_id,
           (trim(elem->>'quantity'))::INT AS quantity
    FROM jsonb_array_elements(p_items) elem
    ORDER BY (trim(elem->>'variant_id'))::UUID ASC
  LOOP
    -- Fetch snapshot details
    SELECT v.id AS variant_id,
           v.product_id,
           v.color,
           v.size,
           p.name AS product_name,
           p.price AS product_price
    INTO v_variant
    FROM public.product_variants v
    JOIN public.products p ON p.id = v.product_id
    WHERE v.id = v_item.variant_id;

    -- Fetch primary product image deterministically (lowest sort_order, then lowest id)
    SELECT image_url INTO v_product_image
    FROM public.product_images
    WHERE product_id = v_variant.product_id
    ORDER BY sort_order ASC, id ASC
    LIMIT 1;

    v_line_subtotal := v_variant.product_price * v_item.quantity;

    -- Insert immutable historical order item snapshot (no speculative SKU)
    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_id,
      product_name,
      product_image,
      product_price,
      color,
      size,
      quantity,
      subtotal
    ) VALUES (
      v_order_id,
      v_variant.product_id,
      v_variant.variant_id,
      v_variant.product_name,
      v_product_image,
      v_variant.product_price,
      v_variant.color,
      v_variant.size,
      v_item.quantity,
      v_line_subtotal
    );

    -- Decrement inventory atomically
    UPDATE public.product_variants
    SET stock = stock - v_item.quantity
    WHERE id = v_variant.variant_id;
  END LOOP;

  -- ==================================================================
  -- 10. RETURN SAFE ORDER RESULT
  -- ==================================================================
  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total', v_total,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'currency', 'THB',
    'is_idempotent_replay', false
  );
END;
$$;

-- Revoke public execution and grant only to anon and authenticated roles
REVOKE EXECUTE ON FUNCTION public.create_order_secure(JSONB, JSONB, JSONB, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_secure(JSONB, JSONB, JSONB, TEXT, UUID) TO anon, authenticated;
