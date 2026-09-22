import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local not found!");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const [key, ...rest] = trimmed.split("=");
    envVars[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
  }
}

const url = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const key = envVars["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

const supabase = createClient(url, key);

async function verify() {
  console.log("🔍 Verifying DOMPI database contents...\n");

  // 1. Categories
  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("id, name, slug");
  if (catErr) {
    console.error("❌ Error fetching categories:", catErr.message);
  } else {
    console.log(`✅ Categories count: ${categories.length}`);
    categories.forEach((c) => console.log(`   - [${c.slug}] ${c.name}`));
  }

  // 2. Products
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, name, slug, price, is_active");
  if (prodErr) {
    console.error("❌ Error fetching products:", prodErr.message);
  } else {
    console.log(`\n✅ Products count: ${products.length}`);
    products.forEach((p) => console.log(`   - [${p.slug}] ${p.name} (THB ${p.price})`));
  }

  // 3. Product Images
  const { data: images, error: imgErr } = await supabase
    .from("product_images")
    .select("id, product_id, image_url, sort_order");
  if (imgErr) {
    console.error("❌ Error fetching product images:", imgErr.message);
  } else {
    console.log(`\n✅ Product images count: ${images?.length || 0}`);
  }

  // 4. Product Variants
  const { data: variants, error: varErr } = await supabase
    .from("product_variants")
    .select("id, product_id, color, size, stock");
  if (varErr) {
    console.error("❌ Error fetching product variants:", varErr.message);
  } else {
    console.log(`\n✅ Product variants count: ${variants?.length || 0}`);
    const totalStock = (variants || []).reduce((sum, v) => sum + (v.stock || 0), 0);
    console.log(`✅ Total inventory across all variants: ${totalStock} units`);
  }
}

verify().catch(console.error);
