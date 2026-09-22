import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { ALL_PRODUCTS } from "../src/data/products";

// 1. Read environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local not found!");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const [key, ...rest] = trimmed.split("=");
    envVars[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
  }
}

const url = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const key = envVars["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

if (!url || !key) {
  console.error("❌ Missing Supabase URL or Publishable Key in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function runReadOnlyVerification() {
  console.log("=================================================");
  console.log("DOMPI CATALOG SEED READ-ONLY VERIFICATION");
  console.log("=================================================\n");

  const mismatches: string[] = [];

  // Fetch Categories
  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("id, name, slug, description, created_at, updated_at");
  if (catErr) {
    console.error("Error fetching categories:", catErr);
    process.exit(1);
  }

  // Fetch Products
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, name, slug, description, price, category_id, is_active, created_at, updated_at");
  if (prodErr) {
    console.error("Error fetching products:", prodErr);
    process.exit(1);
  }

  // Fetch Product Images
  const { data: images, error: imgErr } = await supabase
    .from("product_images")
    .select("id, product_id, image_url, alt_text, sort_order, created_at");
  if (imgErr) {
    console.error("Error fetching images:", imgErr);
    process.exit(1);
  }

  // Fetch Product Variants
  const { data: variants, error: varErr } = await supabase
    .from("product_variants")
    .select("id, product_id, color, size, stock, created_at, updated_at");
  if (varErr) {
    console.error("Error fetching variants:", varErr);
    process.exit(1);
  }

  console.log(`📊 Actual Row Counts:`);
  console.log(`- Categories:       ${categories.length} (expected: 4)`);
  console.log(`- Products:         ${products.length} (expected: 12)`);
  console.log(`- Product Images:   ${images.length} (expected: 28)`);
  console.log(`- Product Variants: ${variants.length} (expected: 86)\n`);

  if (categories.length !== 4) mismatches.push(`Expected 4 categories, found ${categories.length}`);
  if (products.length !== 12) mismatches.push(`Expected 12 products, found ${products.length}`);
  if (images.length !== 28) mismatches.push(`Expected 28 images, found ${images.length}`);
  if (variants.length !== 86) mismatches.push(`Expected 86 variants, found ${variants.length}`);

  // Check 1: Every product has a valid category relationship
  const categoryIdSet = new Set(categories.map((c) => c.id));
  for (const prod of products) {
    if (!prod.category_id || !categoryIdSet.has(prod.category_id)) {
      mismatches.push(`Product "${prod.slug}" has invalid or missing category_id: ${prod.category_id}`);
    }
  }

  // Check 2: Every product image belongs to an existing product
  const productIdSet = new Set(products.map((p) => p.id));
  const productBySlug = new Map(products.map((p) => [p.slug, p]));
  for (const img of images) {
    if (!img.product_id || !productIdSet.has(img.product_id)) {
      mismatches.push(`Image id ${img.id} references non-existent product_id: ${img.product_id}`);
    }
  }

  // Check 3: Every product variant belongs to an existing product
  for (const v of variants) {
    if (!v.product_id || !productIdSet.has(v.product_id)) {
      mismatches.push(`Variant id ${v.id} references non-existent product_id: ${v.product_id}`);
    }
  }

  // Check 4: No duplicate product slugs
  const prodSlugs = new Set<string>();
  for (const p of products) {
    if (prodSlugs.has(p.slug)) {
      mismatches.push(`Duplicate product slug found: "${p.slug}"`);
    }
    prodSlugs.add(p.slug);
  }

  // Check 5: No duplicate category slugs
  const catSlugs = new Set<string>();
  for (const c of categories) {
    if (catSlugs.has(c.slug)) {
      mismatches.push(`Duplicate category slug found: "${c.slug}"`);
    }
    catSlugs.add(c.slug);
  }

  // Check 6: No duplicate variants for the same (product_id, color, size)
  const variantKeys = new Set<string>();
  for (const v of variants) {
    const key = `${v.product_id}::${v.color}::${v.size}`;
    if (variantKeys.has(key)) {
      mismatches.push(`Duplicate variant found for product_id ${v.product_id}, color "${v.color}", size "${v.size}"`);
    }
    variantKeys.add(key);
  }

  // Check 7: No negative stock values
  for (const v of variants) {
    if (v.stock < 0) {
      mismatches.push(`Variant id ${v.id} has negative stock: ${v.stock}`);
    }
  }

  // Check 8: Product names, slugs, descriptions, and prices match src/data/products.ts
  for (const sourceProd of ALL_PRODUCTS) {
    const dbProd = productBySlug.get(sourceProd.slug);
    if (!dbProd) {
      mismatches.push(`Source product "${sourceProd.slug}" not found in database`);
      continue;
    }

    if (dbProd.name !== sourceProd.name) {
      mismatches.push(`Product name mismatch for "${sourceProd.slug}": DB="${dbProd.name}", TS="${sourceProd.name}"`);
    }
    if (dbProd.description !== sourceProd.description) {
      mismatches.push(`Product description mismatch for "${sourceProd.slug}"`);
    }
    if (Number(dbProd.price) !== Number(sourceProd.price)) {
      mismatches.push(`Product price mismatch for "${sourceProd.slug}": DB=${dbProd.price}, TS=${sourceProd.price}`);
    }

    // Check category matches
    const expectedCatSlug = sourceProd.category.toLowerCase().replace(/\s+/g, "-");
    const dbCat = categories.find((c) => c.id === dbProd.category_id);
    if (!dbCat || dbCat.slug !== expectedCatSlug) {
      mismatches.push(`Product category mismatch for "${sourceProd.slug}": DB category slug="${dbCat?.slug}", TS category="${sourceProd.category}" (${expectedCatSlug})`);
    }
  }

  console.log("=================================================");
  console.log("DETAILED AUDIT RESULTS:");
  console.log("1. Valid product -> category relations:   " + (categories.length === 4 && products.every(p => categoryIdSet.has(p.category_id)) ? "✅ PASSED" : "❌ FAILED"));
  console.log("2. Valid image -> product relations:      " + (images.every(img => productIdSet.has(img.product_id)) ? "✅ PASSED" : "❌ FAILED"));
  console.log("3. Valid variant -> product relations:    " + (variants.every(v => productIdSet.has(v.product_id)) ? "✅ PASSED" : "❌ FAILED"));
  console.log("4. Unique product slugs:                  " + (prodSlugs.size === products.length ? "✅ PASSED" : "❌ FAILED"));
  console.log("5. Unique category slugs:                 " + (catSlugs.size === categories.length ? "✅ PASSED" : "❌ FAILED"));
  console.log("6. Unique (product_id, color, size):      " + (variantKeys.size === variants.length ? "✅ PASSED" : "❌ FAILED"));
  console.log("7. Non-negative stock:                    " + (variants.every(v => v.stock >= 0) ? "✅ PASSED" : "❌ FAILED"));
  console.log("8. Data match with products.ts:           " + (ALL_PRODUCTS.every(p => {
    const dbP = productBySlug.get(p.slug);
    return dbP && dbP.name === p.name && dbP.description === p.description && Number(dbP.price) === Number(p.price);
  }) ? "✅ PASSED" : "❌ FAILED"));
  console.log("=================================================\n");

  if (mismatches.length > 0) {
    console.log(`❌ Mismatches found (${mismatches.length}):`);
    mismatches.forEach((m, idx) => console.log(`   ${idx + 1}. ${m}`));
    process.exit(1);
  } else {
    console.log("🎉 All 8 assertions passed! Database seed is 100% fully verified.");
  }
}

runReadOnlyVerification().catch((err) => {
  console.error("Verification crashed:", err);
  process.exit(1);
});
