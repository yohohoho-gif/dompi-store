-- ====================================================================
-- DOMPI Product Images Supabase Storage Configuration
-- Version: 20260922000004
-- Idempotent & Non-destructive: No DROP, DELETE, or TRUNCATE statements
-- ====================================================================

-- 1. Create product-images storage bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- 2. Storage Row Level Security (RLS) Policies on storage.objects

-- A. Public can read/view product images for storefront display
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can view product images'
  ) THEN
    CREATE POLICY "Public can view product images"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'product-images');
  END IF;
END $$;

-- B. Admins can upload product images (INSERT)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can upload product images'
  ) THEN
    CREATE POLICY "Admins can upload product images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
  END IF;
END $$;

-- C. Admins can update product images (UPDATE)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can update product images'
  ) THEN
    CREATE POLICY "Admins can update product images"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'product-images' AND public.is_admin())
      WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
  END IF;
END $$;

-- D. Admins can delete product images (DELETE)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can delete product images'
  ) THEN
    CREATE POLICY "Admins can delete product images"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'product-images' AND public.is_admin());
  END IF;
END $$;
