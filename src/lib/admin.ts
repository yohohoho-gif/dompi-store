import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { ProductVariant } from "@/lib/catalog";

export interface AdminProductSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  isActive: boolean;
  categoryId: string | null;
  categoryName: string;
  categorySlug: string;
  images: { id: string; url: string; alt: string | null; sortOrder: number }[];
  variants: ProductVariant[];
  totalStock: number;
  variantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  outOfStockProducts: number;
  totalCategories: number;
  totalInventory: number;
}

export function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase URL or credentials for Admin client");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Server-side authorization check.
 * Strictly verifies the authenticated session and confirms membership in admin_users table.
 */
export async function requireAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authentication required: No active administrator session found.");
  }

  const { data: adminRecord, error: adminError } = await supabase
    .from("admin_users")
    .select("id, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (adminError || !adminRecord) {
    throw new Error("Access denied: This authenticated account does not possess administrative privileges.");
  }

  return { user, adminRecord, supabase };
}

export async function verifyAdminAccess(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

export async function getCurrentAdmin(): Promise<{ id: string; email: string; role: string } | null> {
  try {
    const { user, adminRecord } = await requireAdmin();
    return {
      id: user.id,
      email: adminRecord.email || user.email || "",
      role: adminRecord.role,
    };
  } catch {
    return null;
  }
}

/**
 * Fetches all products with full relational data for the Admin Dashboard.
 */
export async function getAdminProducts(): Promise<AdminProductSummary[]> {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        description,
        price,
        is_active,
        category_id,
        created_at,
        updated_at,
        category:categories(id, name, slug),
        images:product_images(id, image_url, alt_text, sort_order),
        variants:product_variants(id, color, size, stock)
      `)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("Admin fetch products error:", error?.message);
      return [];
    }

    return data.map((raw) => {
      const sortedImages = [...(raw.images || [])].sort((a, b) => a.sort_order - b.sort_order);
      const variants: ProductVariant[] = (raw.variants || []).map((v) => ({
        id: v.id,
        productId: raw.id,
        color: v.color,
        size: v.size,
        stock: v.stock,
      }));

      const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
      const categoryObj = Array.isArray(raw.category) ? raw.category[0] : raw.category;

      return {
        id: raw.id,
        name: raw.name,
        slug: raw.slug,
        description: raw.description,
        price: Number(raw.price),
        isActive: Boolean(raw.is_active),
        categoryId: raw.category_id,
        categoryName: categoryObj?.name || "Unassigned",
        categorySlug: categoryObj?.slug || "unassigned",
        images: sortedImages.map((img) => ({
          id: img.id,
          url: img.image_url,
          alt: img.alt_text,
          sortOrder: img.sort_order,
        })),
        variants,
        totalStock,
        variantCount: variants.length,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
      };
    });
  } catch (err) {
    console.error("Failed to load admin products:", err);
    return [];
  }
}

/**
 * Fetches a single product by UUID for editing.
 */
export async function getAdminProductById(id: string): Promise<AdminProductSummary | null> {
  try {
    const supabase = getAdminClient();

    const { data: raw, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        description,
        price,
        is_active,
        category_id,
        created_at,
        updated_at,
        category:categories(id, name, slug),
        images:product_images(id, image_url, alt_text, sort_order),
        variants:product_variants(id, color, size, stock)
      `)
      .eq("id", id)
      .single();

    if (error || !raw) {
      console.error("Admin fetch product by id error:", error?.message);
      return null;
    }

    const sortedImages = [...(raw.images || [])].sort((a, b) => a.sort_order - b.sort_order);
    const variants: ProductVariant[] = (raw.variants || []).map((v) => ({
      id: v.id,
      productId: raw.id,
      color: v.color,
      size: v.size,
      stock: v.stock,
    }));

    const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    const categoryObj = Array.isArray(raw.category) ? raw.category[0] : raw.category;

    return {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      description: raw.description,
      price: Number(raw.price),
      isActive: Boolean(raw.is_active),
      categoryId: raw.category_id,
      categoryName: categoryObj?.name || "Unassigned",
      categorySlug: categoryObj?.slug || "unassigned",
      images: sortedImages.map((img) => ({
        id: img.id,
        url: img.image_url,
        alt: img.alt_text,
        sortOrder: img.sort_order,
      })),
      variants,
      totalStock,
      variantCount: variants.length,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };
  } catch (err) {
    console.error("Failed to load admin product by id:", err);
    return null;
  }
}

/**
 * Fetches all categories for form selectors.
 */
export async function getAdminCategories(): Promise<{ id: string; name: string; slug: string }[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("name", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data;
  } catch (err) {
    console.error("Admin fetch categories error:", err);
    return [];
  }
}

/**
 * Calculates overview metrics for the /admin landing page.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const products = await getAdminProducts();
  const categories = await getAdminCategories();

  let activeProducts = 0;
  let inactiveProducts = 0;
  let outOfStockProducts = 0;
  let totalInventory = 0;

  for (const p of products) {
    if (p.isActive) {
      activeProducts++;
    } else {
      inactiveProducts++;
    }
    if (p.totalStock === 0) {
      outOfStockProducts++;
    }
    totalInventory += p.totalStock;
  }

  return {
    totalProducts: products.length,
    activeProducts,
    inactiveProducts,
    outOfStockProducts,
    totalCategories: categories.length,
    totalInventory,
  };
}
