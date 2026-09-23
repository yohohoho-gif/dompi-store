import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Product, ProductColor } from "@/data/products";

function getCatalogClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
  }

  return createSupabaseClient(supabaseUrl, supabasePublishableKey);
}

export interface ProductVariant {
  id: string;
  productId: string;
  color: string;
  size: string;
  stock: number;
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductWithVariants extends Product {
  variants?: ProductVariant[];
  categorySlug?: string;
}

const COLOR_HEX_MAP: Record<string, string> = {
  "Vintage Black": "#171717",
  "Chalk White": "#F5F5F5",
  "Concrete Gray": "#737373",
  "Jet Black": "#0A0A0A",
  "Heather Slate": "#525252",
  "Off White": "#E5E5E5",
  "Onyx Black": "#111111",
  "Cement Gray": "#737373",
  "Pure Black": "#000000",
  "Stealth Slate": "#404040",
  "Acid Charcoal": "#262626",
  "Acid Ash": "#525252",
  "Acid Moss": "#4A5240",
  "Pitch Black": "#0A0A0A",
  "Ghost White": "#FAFAFA",
  "Matte Black": "#171717",
  "Heather Gray": "#737373",
  "Carbon": "#1C1917",
  "Raw Black Denim": "#141414",
  "Deep Indigo": "#1E293B",
  "Stone": "#A8A29E",
  "Washed Black": "#262626",
  "Bone": "#E7E5E4",
  "Stealth Black": "#0F172A",
  "Gunmetal": "#475569",
  "Olive Drab": "#3D4434",
  "Sandstone": "#D4C5B9",
  "Coyote Brown": "#81613C",
  "Oatmeal Marl": "#D6D1CA",
  "Washed Olive": "#555D50",
  "Raw Khaki": "#B8A389",
  "Dark Navy": "#1B2430",
  "Forest Monolith": "#2B3A30",
  "Monochrome Ash": "#444444",
  "Washed Tobacco": "#8B5A2B",
  "Faded Black": "#2B2B2B",
  "Natural Ecru": "#F4F1EA",
  "Deep Espresso": "#2B1E1A",
};

export function getColorHex(name: string): string {
  if (COLOR_HEX_MAP[name]) return COLOR_HEX_MAP[name];
  const lower = name.toLowerCase();
  if (lower.includes("white") || lower.includes("bone") || lower.includes("ecru")) return "#F5F5F5";
  if (lower.includes("black") || lower.includes("charcoal") || lower.includes("onyx")) return "#171717";
  if (lower.includes("gray") || lower.includes("slate") || lower.includes("ash")) return "#737373";
  if (lower.includes("olive") || lower.includes("moss") || lower.includes("green")) return "#4A5240";
  if (lower.includes("navy") || lower.includes("indigo") || lower.includes("blue")) return "#1B2430";
  if (lower.includes("brown") || lower.includes("tobacco") || lower.includes("espresso")) return "#4A3525";
  if (lower.includes("khaki") || lower.includes("sand")) return "#C2B280";
  return "#222222";
}

interface RawCategory {
  id: string;
  name: string;
  slug: string;
}

interface RawImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

interface RawVariant {
  id: string;
  color: string;
  size: string;
  stock: number;
}

interface RawProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | string;
  is_active: boolean;
  created_at: string;
  category: RawCategory | null;
  images: RawImage[] | null;
  variants: RawVariant[] | null;
}

function transformRawProduct(raw: RawProduct): ProductWithVariants {
  const sortedImages = [...(raw.images || [])].sort((a, b) => a.sort_order - b.sort_order);
  const imageUrls = sortedImages.map((img) => img.image_url);
  const primaryImage =
    imageUrls[0] ||
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80";

  const rawVariants = raw.variants || [];
  const variants: ProductVariant[] = rawVariants.map((v) => ({
    id: v.id,
    productId: raw.id,
    color: v.color,
    size: v.size,
    stock: v.stock,
  }));

  // Distinct colors
  const colorNames = Array.from(new Set(variants.map((v) => v.color)));
  const colors: ProductColor[] = colorNames.map((name) => ({
    name,
    hex: getColorHex(name),
  }));

  // Distinct sizes preserving order
  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "ONE SIZE"];
  const uniqueSizes = Array.from(new Set(variants.map((v) => v.size)));
  uniqueSizes.sort((a, b) => {
    const idxA = sizeOrder.indexOf(a);
    const idxB = sizeOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return a.localeCompare(b);
  });

  // Total stock across variants
  const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    category: raw.category?.name || "General",
    categorySlug: raw.category?.slug || "",
    price: Number(raw.price),
    currency: "THB",
    image: primaryImage,
    images: imageUrls.length > 0 ? imageUrls : [primaryImage],
    description: raw.description || "",
    featured: true,
    isNew: true,
    createdAt: raw.created_at,
    colors: colors.length > 0 ? colors : [{ name: "Standard", hex: "#171717" }],
    sizes: uniqueSizes.length > 0 ? uniqueSizes : ["M"],
    stock: totalStock,
    materials: "Heavyweight premium cotton jersey. Pre-shrunk finish. Machine wash cold.",
    sizeGuide: "Standard contemporary streetwear relaxed fit. Order true to size.",
    shippingReturns:
      "Complimentary standard shipping on all orders over THB 2,500. Free 14-day domestic returns.",
    variants,
  };
}

/**
 * Fetches all active catalog products and categories from Supabase.
 */
export async function getSupabaseCatalog(): Promise<{
  products: ProductWithVariants[];
  categories: CatalogCategory[];
}> {
  try {
    const supabase = getCatalogClient();

    // 1. Fetch categories
    const { data: catData, error: catError } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("name", { ascending: true });

    if (catError) {
      console.error("Supabase error fetching categories:", catError.message);
    }

    const categories: CatalogCategory[] = catData || [];

    // 2. Fetch active products with joined categories, images, and variants
    const { data: prodData, error: prodError } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        description,
        price,
        is_active,
        created_at,
        category:categories(id, name, slug),
        images:product_images(id, image_url, alt_text, sort_order),
        variants:product_variants(id, color, size, stock)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (prodError) {
      console.error("Supabase error fetching products:", prodError.message);
      return { products: [], categories: [] };
    }

    const products = (prodData as unknown as RawProduct[]).map(transformRawProduct);

    return {
      products,
      categories,
    };
  } catch (err) {
    console.error("Catalog fetch error:", err);
    return { products: [], categories: [] };
  }
}

/**
 * Fetches a single product by slug from Supabase.
 */
export async function getSupabaseProductBySlug(slug: string): Promise<ProductWithVariants | null> {
  try {
    const supabase = getCatalogClient();
    const decoded = decodeURIComponent(slug).toLowerCase();

    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        description,
        price,
        is_active,
        created_at,
        category:categories(id, name, slug),
        images:product_images(id, image_url, alt_text, sort_order),
        variants:product_variants(id, color, size, stock)
      `)
      .eq("slug", decoded)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return null;
    }

    return transformRawProduct(data as unknown as RawProduct);
  } catch (err) {
    console.error("Product by slug error:", err);
    return null;
  }
}

/**
 * Fetches related products from Supabase matching the product's category.
 */
export async function getSupabaseRelatedProducts(
  product: ProductWithVariants,
  limit = 4
): Promise<ProductWithVariants[]> {
  try {
    const supabase = getCatalogClient();

    // Query products excluding current product
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        description,
        price,
        is_active,
        created_at,
        category:categories(id, name, slug),
        images:product_images(id, image_url, alt_text, sort_order),
        variants:product_variants(id, color, size, stock)
      `)
      .eq("is_active", true)
      .neq("slug", product.slug)
      .limit(limit * 2);

    if (error || !data) {
      return [];
    }

    const all = (data as unknown as RawProduct[]).map(transformRawProduct);

    // Prefer same category
    const sameCategory = all.filter((p) => p.category === product.category);
    if (sameCategory.length >= limit) {
      return sameCategory.slice(0, limit);
    }

    const others = all.filter((p) => p.category !== product.category);
    return [...sameCategory, ...others].slice(0, limit);
  } catch (err) {
    console.error("Related products error:", err);
    return [];
  }
}

/**
 * Fetches all active product slugs from Supabase for static route generation.
 */
export async function getSupabaseProductSlugs(): Promise<{ slug: string }[]> {
  try {
    const supabase = getCatalogClient();
    const { data, error } = await supabase
      .from("products")
      .select("slug")
      .eq("is_active", true);

    if (error || !data) {
      return [];
    }

    return data.map((row) => ({ slug: row.slug }));
  } catch (err) {
    console.error("Product slugs error:", err);
    return [];
  }
}
