import { SupabaseClient } from "@supabase/supabase-js";

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Generate an isolated storage path for a product image.
 * Format: products/{productId}/{timestamp}_{random}_{sanitizedFileName}
 */
export function generateProductImagePath(productId: string, originalFileName: string): string {
  const sanitized = originalFileName
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "-")
    .replace(/-+/g, "-");
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `products/${productId}/${timestamp}_${randomSuffix}_${sanitized}`;
}

/**
 * Extracts storage relative path from a Supabase Storage public URL if it belongs to product-images.
 */
export function getStoragePathFromUrl(url: string): string | null {
  try {
    const marker = `/${PRODUCT_IMAGES_BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(url.substring(idx + marker.length));
  } catch {
    return null;
  }
}

export interface UploadResult {
  publicUrl: string;
  path: string;
}

/**
 * Upload a product image to Supabase Storage via client-side authenticated session.
 */
export async function uploadProductImage(
  file: File,
  productId: string,
  supabase: SupabaseClient
): Promise<UploadResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      `Unsupported file type "${file.type}". Allowed: JPG, PNG, WEBP, AVIF.`
    );
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      `File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds the 10MB limit.`
    );
  }

  const path = generateProductImagePath(productId, file.name);

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(path);

  if (!data?.publicUrl) {
    throw new Error("Failed to resolve public URL for uploaded image.");
  }

  return {
    publicUrl: data.publicUrl,
    path,
  };
}

/**
 * Delete a product image from Supabase Storage.
 */
export async function deleteProductImage(
  pathOrUrl: string,
  supabase: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  const path = pathOrUrl.startsWith("http")
    ? getStoragePathFromUrl(pathOrUrl)
    : pathOrUrl;

  if (!path) {
    // If it's an external URL (e.g. Unsplash), no storage deletion needed
    return { success: true };
  }

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([path]);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
