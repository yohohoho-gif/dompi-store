import fs from "fs";
import path from "path";
import { ALL_PRODUCTS, CATEGORIES } from "../src/data/products";

function generate() {
  let sql = `-- ====================================================================
-- DOMPI Product & Category Seed Migration
-- Version: 20260922000002
-- Idempotent: Can be run multiple times safely without creating duplicates
-- No DROP, DELETE, or TRUNCATE statements
-- ====================================================================

-- 1. SEED CATEGORIES (4 categories)
`;

  for (const cat of CATEGORIES) {
    const name = cat.name.replace(/'/g, "''");
    const slug = cat.slug.replace(/'/g, "''");
    sql += `INSERT INTO categories (name, slug, description)
VALUES ('${name}', '${slug}', 'Curated DOMPI ${name} collection')
ON CONFLICT (slug) DO NOTHING;\n\n`;
  }

  sql += `-- 2. SEED PRODUCTS (12 products)\n`;

  for (const prod of ALL_PRODUCTS) {
    const name = prod.name.replace(/'/g, "''");
    const slug = prod.slug.replace(/'/g, "''");
    const desc = prod.description.replace(/'/g, "''");
    const price = prod.price;
    const catSlug = prod.category.toLowerCase().replace(/\s+/g, "-");

    sql += `-- Product: ${prod.name} (${prod.slug})
INSERT INTO products (name, slug, description, price, category_id, is_active)
SELECT '${name}', '${slug}', '${desc}', ${price}, c.id, true
FROM categories c
WHERE c.slug = '${catSlug}'
ON CONFLICT (slug) DO NOTHING;\n\n`;

    // 3. Images
    const allImages = prod.images && prod.images.length > 0 ? prod.images : [prod.image];
    sql += `-- Images for ${prod.slug}\n`;
    allImages.forEach((imgUrl, idx) => {
      const cleanUrl = imgUrl.replace(/'/g, "''");
      sql += `INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, '${cleanUrl}', '${name} angle ${idx + 1}', ${idx}
FROM products p
WHERE p.slug = '${slug}'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = '${cleanUrl}'
  );\n`;
    });
    sql += `\n`;

    // 4. Variants (Color x Size)
    sql += `-- Variants for ${prod.slug}\n`;
    const colors = prod.colors && prod.colors.length > 0 ? prod.colors : [{ name: "Standard", hex: "#000" }];
    const sizes = prod.sizes && prod.sizes.length > 0 ? prod.sizes : ["ONE SIZE"];
    const perVariantStock = Math.max(1, Math.round(prod.stock / (colors.length * sizes.length)));

    for (const c of colors) {
      for (const s of sizes) {
        const cName = c.name.replace(/'/g, "''");
        const sName = s.replace(/'/g, "''");
        sql += `INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, '${cName}', '${sName}', ${perVariantStock}
FROM products p
WHERE p.slug = '${slug}'
ON CONFLICT (product_id, color, size) DO NOTHING;\n`;
      }
    }
    sql += `\n`;
  }

  const outPath = path.resolve(process.cwd(), "supabase/migrations/20260922000002_seed_products.sql");
  fs.writeFileSync(outPath, sql, "utf-8");
  console.log("Successfully generated seed migration:", outPath);
}

generate();
