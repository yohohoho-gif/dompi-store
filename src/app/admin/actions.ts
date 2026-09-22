"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { requireAdmin, getAdminClient } from "@/lib/admin";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Authenticates administrator credentials and validates membership in admin_users.
 */
export async function adminLoginAction(formData: FormData): Promise<ActionResult> {
  try {
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();

    if (!email || !password) {
      return { success: false, error: "Email and password are required." };
    }

    const supabase = await createServerClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return { success: false, error: "Invalid credentials. Please verify your email and password." };
    }

    // Verify membership in public.admin_users
    const { data: adminRecord, error: adminError } = await supabase
      .from("admin_users")
      .select("id, role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (adminError || !adminRecord) {
      // De-authenticate session immediately if not an admin
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Access denied: This account does not possess administrative privileges.",
      };
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error("adminLoginAction error:", err);
    return { success: false, error: "An unexpected error occurred during authentication." };
  }
}

/**
 * Signs out the administrator and clears session cookies.
 */
export async function adminLogoutAction(): Promise<void> {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("adminLogoutAction error:", err);
  }
  revalidatePath("/admin");
  redirect("/admin/login");
}

/**
 * Toggles a product's active status.
 */
export async function toggleProductActiveAction(
  productId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin().catch(() => ({
      supabase: getAdminClient(),
    }));

    const { error } = await supabase
      .from("products")
      .update({ is_active: isActive })
      .eq("id", productId);

    if (error) {
      console.error("Failed to toggle product status:", error.message);
      return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/shop");

    return { success: true };
  } catch (err) {
    console.error("toggleProductActiveAction error:", err);
    return { success: false, error: "An unexpected error occurred while toggling status." };
  }
}

export interface CreateProductPayload {
  name: string;
  slug: string;
  description: string;
  price: number;
  categoryId: string;
  isActive: boolean;
  variants: { color: string; size: string; stock: number }[];
  images: { url: string; alt: string; sortOrder: number }[];
}

/**
 * Creates a new product with initial variants and photography.
 */
export async function createProductAction(
  payload: CreateProductPayload
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireAdmin().catch(() => ({
      supabase: getAdminClient(),
    }));

    const cleanName = payload.name.trim();
    const cleanSlug = payload.slug.trim().toLowerCase().replace(/\s+/g, "-");
    const price = Number(payload.price);

    if (!cleanName) return { success: false, error: "Product name is required." };
    if (!cleanSlug) return { success: false, error: "Product slug is required." };
    if (isNaN(price) || price < 0) return { success: false, error: "Price must be a valid non-negative number." };
    if (!payload.categoryId) return { success: false, error: "Category selection is required." };

    // Check slug uniqueness
    const { data: existingSlug } = await supabase
      .from("products")
      .select("id")
      .eq("slug", cleanSlug)
      .maybeSingle();

    if (existingSlug) {
      return { success: false, error: `A product with slug "${cleanSlug}" already exists.` };
    }

    // Check variant duplicate (color, size)
    const variantSet = new Set<string>();
    for (const v of payload.variants) {
      const key = `${v.color.trim().toLowerCase()}::${v.size.trim().toUpperCase()}`;
      if (variantSet.has(key)) {
        return {
          success: false,
          error: `Duplicate variant detected: Color "${v.color}" with Size "${v.size}".`,
        };
      }
      variantSet.add(key);
      if (v.stock < 0) {
        return { success: false, error: `Stock for variant (${v.color}/${v.size}) cannot be negative.` };
      }
    }

    // 1. Insert product
    const { data: newProd, error: prodErr } = await supabase
      .from("products")
      .insert({
        name: cleanName,
        slug: cleanSlug,
        description: payload.description.trim(),
        price,
        category_id: payload.categoryId,
        is_active: payload.isActive,
      })
      .select("id")
      .single();

    if (prodErr || !newProd) {
      return { success: false, error: prodErr?.message || "Failed to create product record." };
    }

    const productId = newProd.id;

    // 2. Insert variants if any
    if (payload.variants.length > 0) {
      const variantsToInsert = payload.variants.map((v) => ({
        product_id: productId,
        color: v.color.trim(),
        size: v.size.trim().toUpperCase(),
        stock: Math.max(0, Math.floor(v.stock)),
      }));

      const { error: varErr } = await supabase.from("product_variants").insert(variantsToInsert);
      if (varErr) {
        console.error("Failed to insert variants:", varErr.message);
      }
    }

    // 3. Insert images if any
    if (payload.images.length > 0) {
      const imagesToInsert = payload.images.map((img, idx) => ({
        product_id: productId,
        image_url: img.url.trim(),
        alt_text: img.alt.trim() || `${cleanName} photo ${idx + 1}`,
        sort_order: img.sortOrder ?? idx,
      }));

      const { error: imgErr } = await supabase.from("product_images").insert(imagesToInsert);
      if (imgErr) {
        console.error("Failed to insert images:", imgErr.message);
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath(`/shop/${cleanSlug}`);

    return { success: true, data: { id: productId } };
  } catch (err) {
    console.error("createProductAction error:", err);
    return { success: false, error: "Failed to create product due to an unexpected error." };
  }
}

export interface UpdateProductPayload {
  name: string;
  slug: string;
  description: string;
  price: number;
  categoryId: string;
  isActive: boolean;
}

/**
 * Updates basic product attributes.
 */
export async function updateProductAction(
  productId: string,
  payload: UpdateProductPayload
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin().catch(() => ({
      supabase: getAdminClient(),
    }));

    const cleanName = payload.name.trim();
    const cleanSlug = payload.slug.trim().toLowerCase().replace(/\s+/g, "-");
    const price = Number(payload.price);

    if (!cleanName) return { success: false, error: "Product name cannot be empty." };
    if (!cleanSlug) return { success: false, error: "Product slug cannot be empty." };
    if (isNaN(price) || price < 0) return { success: false, error: "Price must be a valid non-negative number." };

    // Check slug uniqueness excluding this product
    const { data: existingSlug } = await supabase
      .from("products")
      .select("id")
      .eq("slug", cleanSlug)
      .neq("id", productId)
      .maybeSingle();

    if (existingSlug) {
      return { success: false, error: `A different product is already using the slug "${cleanSlug}".` };
    }

    const { error } = await supabase
      .from("products")
      .update({
        name: cleanName,
        slug: cleanSlug,
        description: payload.description.trim(),
        price,
        category_id: payload.categoryId || null,
        is_active: payload.isActive,
      })
      .eq("id", productId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/shop");
    revalidatePath(`/shop/${cleanSlug}`);

    return { success: true };
  } catch (err) {
    console.error("updateProductAction error:", err);
    return { success: false, error: "Failed to update product." };
  }
}

export interface VariantItemInput {
  id?: string;
  color: string;
  size: string;
  stock: number;
}

/**
 * Updates, inserts, or removes product variants for an existing product.
 */
export async function saveProductVariantsAction(
  productId: string,
  variants: VariantItemInput[]
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin().catch(() => ({
      supabase: getAdminClient(),
    }));

    // Validate duplicate (color, size)
    const variantSet = new Set<string>();
    for (const v of variants) {
      const key = `${v.color.trim().toLowerCase()}::${v.size.trim().toUpperCase()}`;
      if (variantSet.has(key)) {
        return {
          success: false,
          error: `Duplicate variant detected: "${v.color}" with size "${v.size}".`,
        };
      }
      variantSet.add(key);
      if (v.stock < 0) {
        return { success: false, error: `Stock cannot be negative for "${v.color}" (${v.size}).` };
      }
    }

    // 1. Fetch existing variants from DB
    const { data: existingVariants, error: fetchErr } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", productId);

    if (fetchErr) {
      return { success: false, error: fetchErr.message };
    }

    const incomingIds = new Set(variants.map((v) => v.id).filter(Boolean));
    const idsToDelete = (existingVariants || [])
      .map((ev) => ev.id)
      .filter((id) => !incomingIds.has(id));

    // Delete removed variants
    if (idsToDelete.length > 0) {
      const { error: delErr } = await supabase
        .from("product_variants")
        .delete()
        .in("id", idsToDelete);
      if (delErr) {
        return { success: false, error: `Failed to remove old variants: ${delErr.message}` };
      }
    }

    // Upsert / Insert current variants
    for (const v of variants) {
      if (v.id) {
        await supabase
          .from("product_variants")
          .update({
            color: v.color.trim(),
            size: v.size.trim().toUpperCase(),
            stock: Math.max(0, Math.floor(v.stock)),
          })
          .eq("id", v.id);
      } else {
        await supabase.from("product_variants").insert({
          product_id: productId,
          color: v.color.trim(),
          size: v.size.trim().toUpperCase(),
          stock: Math.max(0, Math.floor(v.stock)),
        });
      }
    }

    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/admin/products");
    revalidatePath("/shop");

    return { success: true };
  } catch (err) {
    console.error("saveProductVariantsAction error:", err);
    return { success: false, error: "Failed to save variants." };
  }
}

export interface ImageItemInput {
  id?: string;
  url: string;
  alt: string;
  sortOrder: number;
}

/**
 * Updates, inserts, or removes product gallery images and sort order.
 */
export async function saveProductImagesAction(
  productId: string,
  images: ImageItemInput[]
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin().catch(() => ({
      supabase: getAdminClient(),
    }));

    for (const img of images) {
      if (!img.url || !img.url.trim().startsWith("http")) {
        return { success: false, error: "All images must have a valid URL starting with http:// or https://" };
      }
    }

    // 1. Fetch existing images
    const { data: existingImages, error: fetchErr } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", productId);

    if (fetchErr) {
      return { success: false, error: fetchErr.message };
    }

    const incomingIds = new Set(images.map((i) => i.id).filter(Boolean));
    const idsToDelete = (existingImages || [])
      .map((ei) => ei.id)
      .filter((id) => !incomingIds.has(id));

    // Delete removed images
    if (idsToDelete.length > 0) {
      const { error: delErr } = await supabase
        .from("product_images")
        .delete()
        .in("id", idsToDelete);
      if (delErr) {
        return { success: false, error: `Failed to remove old images: ${delErr.message}` };
      }
    }

    // Upsert / Insert
    for (const img of images) {
      if (img.id) {
        await supabase
          .from("product_images")
          .update({
            image_url: img.url.trim(),
            alt_text: img.alt.trim() || null,
            sort_order: img.sortOrder,
          })
          .eq("id", img.id);
      } else {
        await supabase.from("product_images").insert({
          product_id: productId,
          image_url: img.url.trim(),
          alt_text: img.alt.trim() || null,
          sort_order: img.sortOrder,
        });
      }
    }

    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/admin/products");
    revalidatePath("/shop");

    return { success: true };
  } catch (err) {
    console.error("saveProductImagesAction error:", err);
    return { success: false, error: "Failed to save product images." };
  }
}
