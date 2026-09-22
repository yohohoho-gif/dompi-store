-- ====================================================================
-- DOMPI Product & Category Seed Migration
-- Version: 20260922000002
-- Idempotent: Can be run multiple times safely without creating duplicates
-- No DROP, DELETE, or TRUNCATE statements
-- ====================================================================

-- 1. SEED CATEGORIES (4 categories)
INSERT INTO categories (name, slug, description)
VALUES ('T-Shirts', 't-shirts', 'Curated DOMPI T-Shirts collection')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, description)
VALUES ('Hoodies', 'hoodies', 'Curated DOMPI Hoodies collection')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, description)
VALUES ('Pants', 'pants', 'Curated DOMPI Pants collection')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, description)
VALUES ('Accessories', 'accessories', 'Curated DOMPI Accessories collection')
ON CONFLICT (slug) DO NOTHING;

-- 2. SEED PRODUCTS (12 products)
-- Product: RAW EDGES OVERSIZED TEE (raw-edges-oversized-tee)
INSERT INTO products (name, slug, description, price, category_id, is_active)
SELECT 'RAW EDGES OVERSIZED TEE', 'raw-edges-oversized-tee', 'Crafted from 280 GSM heavyweight dry cotton jersey with unrefined raw seam detailing. Built with a relaxed dropped shoulder and boxy architectural drape that holds its structure throughout all-day wear.', 1890, c.id, true
FROM categories c
WHERE c.slug = 't-shirts'
ON CONFLICT (slug) DO NOTHING;

-- Images for raw-edges-oversized-tee
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop&q=85', 'RAW EDGES OVERSIZED TEE angle 1', 0
FROM products p
WHERE p.slug = 'raw-edges-oversized-tee'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop&q=85'
  );
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop&q=85', 'RAW EDGES OVERSIZED TEE angle 2', 1
FROM products p
WHERE p.slug = 'raw-edges-oversized-tee'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop&q=85'
  );
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&auto=format&fit=crop&q=85', 'RAW EDGES OVERSIZED TEE angle 3', 2
FROM products p
WHERE p.slug = 'raw-edges-oversized-tee'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&auto=format&fit=crop&q=85'
  );

-- Variants for raw-edges-oversized-tee
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Vintage Black', 'S', 1
FROM products p
WHERE p.slug = 'raw-edges-oversized-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Vintage Black', 'M', 1
FROM products p
WHERE p.slug = 'raw-edges-oversized-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Vintage Black', 'L', 1
FROM products p
WHERE p.slug = 'raw-edges-oversized-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Vintage Black', 'XL', 1
FROM products p
WHERE p.slug = 'raw-edges-oversized-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Chalk White', 'S', 1
FROM products p
WHERE p.slug = 'raw-edges-oversized-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Chalk White', 'M', 1
FROM products p
WHERE p.slug = 'raw-edges-oversized-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Chalk White', 'L', 1
FROM products p
WHERE p.slug = 'raw-edges-oversized-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Chalk White', 'XL', 1
FROM products p
WHERE p.slug = 'raw-edges-oversized-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Concrete Gray', 'S', 1
FROM products p
WHERE p.slug = 'raw-edges-oversized-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Concrete Gray', 'M', 1
FROM products p
WHERE p.slug = 'raw-edges-oversized-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Concrete Gray', 'L', 1
FROM products p
WHERE p.slug = 'raw-edges-oversized-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Concrete Gray', 'XL', 1
FROM products p
WHERE p.slug = 'raw-edges-oversized-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;

-- Product: HEAVYWEIGHT ARCHIVAL HOODIE (heavyweight-archival-hoodie)
INSERT INTO products (name, slug, description, price, category_id, is_active)
SELECT 'HEAVYWEIGHT ARCHIVAL HOODIE', 'heavyweight-archival-hoodie', 'Substantial 500 GSM custom fleece with a double-layered structured hood that stands upright without drawstrings. Reinforced ribbing at cuffs and hem with flatlock seam construction.', 3490, c.id, true
FROM categories c
WHERE c.slug = 'hoodies'
ON CONFLICT (slug) DO NOTHING;

-- Images for heavyweight-archival-hoodie
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&auto=format&fit=crop&q=85', 'HEAVYWEIGHT ARCHIVAL HOODIE angle 1', 0
FROM products p
WHERE p.slug = 'heavyweight-archival-hoodie'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&auto=format&fit=crop&q=85'
  );
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=1200&auto=format&fit=crop&q=85', 'HEAVYWEIGHT ARCHIVAL HOODIE angle 2', 1
FROM products p
WHERE p.slug = 'heavyweight-archival-hoodie'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=1200&auto=format&fit=crop&q=85'
  );
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=1200&auto=format&fit=crop&q=85', 'HEAVYWEIGHT ARCHIVAL HOODIE angle 3', 2
FROM products p
WHERE p.slug = 'heavyweight-archival-hoodie'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=1200&auto=format&fit=crop&q=85'
  );

-- Variants for heavyweight-archival-hoodie
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Jet Black', 'S', 1
FROM products p
WHERE p.slug = 'heavyweight-archival-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Jet Black', 'M', 1
FROM products p
WHERE p.slug = 'heavyweight-archival-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Jet Black', 'L', 1
FROM products p
WHERE p.slug = 'heavyweight-archival-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Jet Black', 'XL', 1
FROM products p
WHERE p.slug = 'heavyweight-archival-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Heather Slate', 'S', 1
FROM products p
WHERE p.slug = 'heavyweight-archival-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Heather Slate', 'M', 1
FROM products p
WHERE p.slug = 'heavyweight-archival-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Heather Slate', 'L', 1
FROM products p
WHERE p.slug = 'heavyweight-archival-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Heather Slate', 'XL', 1
FROM products p
WHERE p.slug = 'heavyweight-archival-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Off White', 'S', 1
FROM products p
WHERE p.slug = 'heavyweight-archival-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Off White', 'M', 1
FROM products p
WHERE p.slug = 'heavyweight-archival-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Off White', 'L', 1
FROM products p
WHERE p.slug = 'heavyweight-archival-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Off White', 'XL', 1
FROM products p
WHERE p.slug = 'heavyweight-archival-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;

-- Product: MODULAR CARGO TRACK PANTS (modular-cargo-track-pants)
INSERT INTO products (name, slug, description, price, category_id, is_active)
SELECT 'MODULAR CARGO TRACK PANTS', 'modular-cargo-track-pants', 'Multi-pocket tactical track pants engineered in water-resistant matte nylon ripstop. Equipped with cinchable ankle toggles, deep bellows cargo compartments, and an integrated industrial webbing belt.', 2990, c.id, true
FROM categories c
WHERE c.slug = 'pants'
ON CONFLICT (slug) DO NOTHING;

-- Images for modular-cargo-track-pants
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&auto=format&fit=crop&q=85', 'MODULAR CARGO TRACK PANTS angle 1', 0
FROM products p
WHERE p.slug = 'modular-cargo-track-pants'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&auto=format&fit=crop&q=85'
  );
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=1200&auto=format&fit=crop&q=85', 'MODULAR CARGO TRACK PANTS angle 2', 1
FROM products p
WHERE p.slug = 'modular-cargo-track-pants'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=1200&auto=format&fit=crop&q=85'
  );
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=1200&auto=format&fit=crop&q=85', 'MODULAR CARGO TRACK PANTS angle 3', 2
FROM products p
WHERE p.slug = 'modular-cargo-track-pants'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=1200&auto=format&fit=crop&q=85'
  );

-- Variants for modular-cargo-track-pants
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Onyx Black', 'S', 1
FROM products p
WHERE p.slug = 'modular-cargo-track-pants'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Onyx Black', 'M', 1
FROM products p
WHERE p.slug = 'modular-cargo-track-pants'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Onyx Black', 'L', 1
FROM products p
WHERE p.slug = 'modular-cargo-track-pants'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Onyx Black', 'XL', 1
FROM products p
WHERE p.slug = 'modular-cargo-track-pants'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Cement Gray', 'S', 1
FROM products p
WHERE p.slug = 'modular-cargo-track-pants'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Cement Gray', 'M', 1
FROM products p
WHERE p.slug = 'modular-cargo-track-pants'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Cement Gray', 'L', 1
FROM products p
WHERE p.slug = 'modular-cargo-track-pants'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Cement Gray', 'XL', 1
FROM products p
WHERE p.slug = 'modular-cargo-track-pants'
ON CONFLICT (product_id, color, size) DO NOTHING;

-- Product: TACTICAL MONOCHROME CROSSBODY (tactical-monochrome-crossbody)
INSERT INTO products (name, slug, description, price, category_id, is_active)
SELECT 'TACTICAL MONOCHROME CROSSBODY', 'tactical-monochrome-crossbody', 'Compact modular crossbody bag constructed from 1000D ballistic cordura. Features water-tight sealed zippers, an internal organizer sleeve, and an adjustable quick-release tactical buckle strap.', 1590, c.id, true
FROM categories c
WHERE c.slug = 'accessories'
ON CONFLICT (slug) DO NOTHING;

-- Images for tactical-monochrome-crossbody
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&auto=format&fit=crop&q=85', 'TACTICAL MONOCHROME CROSSBODY angle 1', 0
FROM products p
WHERE p.slug = 'tactical-monochrome-crossbody'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&auto=format&fit=crop&q=85'
  );
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&auto=format&fit=crop&q=85', 'TACTICAL MONOCHROME CROSSBODY angle 2', 1
FROM products p
WHERE p.slug = 'tactical-monochrome-crossbody'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&auto=format&fit=crop&q=85'
  );
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&auto=format&fit=crop&q=85', 'TACTICAL MONOCHROME CROSSBODY angle 3', 2
FROM products p
WHERE p.slug = 'tactical-monochrome-crossbody'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&auto=format&fit=crop&q=85'
  );

-- Variants for tactical-monochrome-crossbody
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Pure Black', 'ONE SIZE', 10
FROM products p
WHERE p.slug = 'tactical-monochrome-crossbody'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Stealth Slate', 'ONE SIZE', 10
FROM products p
WHERE p.slug = 'tactical-monochrome-crossbody'
ON CONFLICT (product_id, color, size) DO NOTHING;

-- Product: BOX CUT ACID WASH TEE (box-cut-acid-wash-tee)
INSERT INTO products (name, slug, description, price, category_id, is_active)
SELECT 'BOX CUT ACID WASH TEE', 'box-cut-acid-wash-tee', 'Individually hand-treated acid wash tee offering unique marble grain patterns on each garment. High-density ribbed collar and reinforced shoulder tape.', 1690, c.id, true
FROM categories c
WHERE c.slug = 't-shirts'
ON CONFLICT (slug) DO NOTHING;

-- Images for box-cut-acid-wash-tee
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop&q=85', 'BOX CUT ACID WASH TEE angle 1', 0
FROM products p
WHERE p.slug = 'box-cut-acid-wash-tee'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop&q=85'
  );
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop&q=85', 'BOX CUT ACID WASH TEE angle 2', 1
FROM products p
WHERE p.slug = 'box-cut-acid-wash-tee'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop&q=85'
  );

-- Variants for box-cut-acid-wash-tee
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Acid Charcoal', 'S', 1
FROM products p
WHERE p.slug = 'box-cut-acid-wash-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Acid Charcoal', 'M', 1
FROM products p
WHERE p.slug = 'box-cut-acid-wash-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Acid Charcoal', 'L', 1
FROM products p
WHERE p.slug = 'box-cut-acid-wash-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Acid Charcoal', 'XL', 1
FROM products p
WHERE p.slug = 'box-cut-acid-wash-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Acid Ash', 'S', 1
FROM products p
WHERE p.slug = 'box-cut-acid-wash-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Acid Ash', 'M', 1
FROM products p
WHERE p.slug = 'box-cut-acid-wash-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Acid Ash', 'L', 1
FROM products p
WHERE p.slug = 'box-cut-acid-wash-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Acid Ash', 'XL', 1
FROM products p
WHERE p.slug = 'box-cut-acid-wash-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;

-- Product: MINIMALIST LOGO GRAPHIC TEE (minimalist-logo-graphic-tee)
INSERT INTO products (name, slug, description, price, category_id, is_active)
SELECT 'MINIMALIST LOGO GRAPHIC TEE', 'minimalist-logo-graphic-tee', 'Tonal matte silicone high-density DOMPI chest logo. Ultra-soft combed cotton weave with a tailored neckline and relaxed torso.', 1490, c.id, true
FROM categories c
WHERE c.slug = 't-shirts'
ON CONFLICT (slug) DO NOTHING;

-- Images for minimalist-logo-graphic-tee
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&auto=format&fit=crop&q=85', 'MINIMALIST LOGO GRAPHIC TEE angle 1', 0
FROM products p
WHERE p.slug = 'minimalist-logo-graphic-tee'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&auto=format&fit=crop&q=85'
  );
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop&q=85', 'MINIMALIST LOGO GRAPHIC TEE angle 2', 1
FROM products p
WHERE p.slug = 'minimalist-logo-graphic-tee'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop&q=85'
  );

-- Variants for minimalist-logo-graphic-tee
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Pitch Black', 'S', 3
FROM products p
WHERE p.slug = 'minimalist-logo-graphic-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Pitch Black', 'M', 3
FROM products p
WHERE p.slug = 'minimalist-logo-graphic-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Pitch Black', 'L', 3
FROM products p
WHERE p.slug = 'minimalist-logo-graphic-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Pitch Black', 'XL', 3
FROM products p
WHERE p.slug = 'minimalist-logo-graphic-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Ghost White', 'S', 3
FROM products p
WHERE p.slug = 'minimalist-logo-graphic-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Ghost White', 'M', 3
FROM products p
WHERE p.slug = 'minimalist-logo-graphic-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Ghost White', 'L', 3
FROM products p
WHERE p.slug = 'minimalist-logo-graphic-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Ghost White', 'XL', 3
FROM products p
WHERE p.slug = 'minimalist-logo-graphic-tee'
ON CONFLICT (product_id, color, size) DO NOTHING;

-- Product: DROP SHOULDER THERMAL HOODIE (drop-shoulder-thermal-hoodie)
INSERT INTO products (name, slug, description, price, category_id, is_active)
SELECT 'DROP SHOULDER THERMAL HOODIE', 'drop-shoulder-thermal-hoodie', 'Waffle-knit thermal-lined pullover hoodie providing superior heat retention without excess bulk. Kangaroo pocket with hidden internal phone pouch.', 3690, c.id, true
FROM categories c
WHERE c.slug = 'hoodies'
ON CONFLICT (slug) DO NOTHING;

-- Images for drop-shoulder-thermal-hoodie
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=1200&auto=format&fit=crop&q=85', 'DROP SHOULDER THERMAL HOODIE angle 1', 0
FROM products p
WHERE p.slug = 'drop-shoulder-thermal-hoodie'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=1200&auto=format&fit=crop&q=85'
  );
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&auto=format&fit=crop&q=85', 'DROP SHOULDER THERMAL HOODIE angle 2', 1
FROM products p
WHERE p.slug = 'drop-shoulder-thermal-hoodie'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&auto=format&fit=crop&q=85'
  );

-- Variants for drop-shoulder-thermal-hoodie
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Matte Black', 'S', 1
FROM products p
WHERE p.slug = 'drop-shoulder-thermal-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Matte Black', 'M', 1
FROM products p
WHERE p.slug = 'drop-shoulder-thermal-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Matte Black', 'L', 1
FROM products p
WHERE p.slug = 'drop-shoulder-thermal-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Matte Black', 'XL', 1
FROM products p
WHERE p.slug = 'drop-shoulder-thermal-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Heather Gray', 'S', 1
FROM products p
WHERE p.slug = 'drop-shoulder-thermal-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Heather Gray', 'M', 1
FROM products p
WHERE p.slug = 'drop-shoulder-thermal-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Heather Gray', 'L', 1
FROM products p
WHERE p.slug = 'drop-shoulder-thermal-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Heather Gray', 'XL', 1
FROM products p
WHERE p.slug = 'drop-shoulder-thermal-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;

-- Product: STRUCTURAL ZIP-UP TECH HOODIE (structural-zip-up-tech-hoodie)
INSERT INTO products (name, slug, description, price, category_id, is_active)
SELECT 'STRUCTURAL ZIP-UP TECH HOODIE', 'structural-zip-up-tech-hoodie', 'Full two-way front metal zipper with high-stance funnel neckline. Raglan sleeve articulation for maximum arm mobility and minimalist side-seam hand pockets.', 3890, c.id, true
FROM categories c
WHERE c.slug = 'hoodies'
ON CONFLICT (slug) DO NOTHING;

-- Images for structural-zip-up-tech-hoodie
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=1200&auto=format&fit=crop&q=85', 'STRUCTURAL ZIP-UP TECH HOODIE angle 1', 0
FROM products p
WHERE p.slug = 'structural-zip-up-tech-hoodie'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=1200&auto=format&fit=crop&q=85'
  );
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&auto=format&fit=crop&q=85', 'STRUCTURAL ZIP-UP TECH HOODIE angle 2', 1
FROM products p
WHERE p.slug = 'structural-zip-up-tech-hoodie'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&auto=format&fit=crop&q=85'
  );

-- Variants for structural-zip-up-tech-hoodie
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Carbon', 'S', 1
FROM products p
WHERE p.slug = 'structural-zip-up-tech-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Carbon', 'M', 1
FROM products p
WHERE p.slug = 'structural-zip-up-tech-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Carbon', 'L', 1
FROM products p
WHERE p.slug = 'structural-zip-up-tech-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Carbon', 'XL', 1
FROM products p
WHERE p.slug = 'structural-zip-up-tech-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Off White', 'S', 1
FROM products p
WHERE p.slug = 'structural-zip-up-tech-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Off White', 'M', 1
FROM products p
WHERE p.slug = 'structural-zip-up-tech-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Off White', 'L', 1
FROM products p
WHERE p.slug = 'structural-zip-up-tech-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Off White', 'XL', 1
FROM products p
WHERE p.slug = 'structural-zip-up-tech-hoodie'
ON CONFLICT (product_id, color, size) DO NOTHING;

-- Product: RAW DENIM RELAXED FIT TROUSERS (raw-denim-relaxed-fit-trousers)
INSERT INTO products (name, slug, description, price, category_id, is_active)
SELECT 'RAW DENIM RELAXED FIT TROUSERS', 'raw-denim-relaxed-fit-trousers', '14.5 oz Japanese selvedge raw indigo denim. Unwashed stiff hand-feel designed to fade naturally with your personal wear patterns over time.', 3290, c.id, true
FROM categories c
WHERE c.slug = 'pants'
ON CONFLICT (slug) DO NOTHING;

-- Images for raw-denim-relaxed-fit-trousers
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=1200&auto=format&fit=crop&q=85', 'RAW DENIM RELAXED FIT TROUSERS angle 1', 0
FROM products p
WHERE p.slug = 'raw-denim-relaxed-fit-trousers'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=1200&auto=format&fit=crop&q=85'
  );
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&auto=format&fit=crop&q=85', 'RAW DENIM RELAXED FIT TROUSERS angle 2', 1
FROM products p
WHERE p.slug = 'raw-denim-relaxed-fit-trousers'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&auto=format&fit=crop&q=85'
  );

-- Variants for raw-denim-relaxed-fit-trousers
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Raw Black Denim', 'S', 1
FROM products p
WHERE p.slug = 'raw-denim-relaxed-fit-trousers'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Raw Black Denim', 'M', 1
FROM products p
WHERE p.slug = 'raw-denim-relaxed-fit-trousers'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Raw Black Denim', 'L', 1
FROM products p
WHERE p.slug = 'raw-denim-relaxed-fit-trousers'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Raw Black Denim', 'XL', 1
FROM products p
WHERE p.slug = 'raw-denim-relaxed-fit-trousers'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Deep Indigo', 'S', 1
FROM products p
WHERE p.slug = 'raw-denim-relaxed-fit-trousers'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Deep Indigo', 'M', 1
FROM products p
WHERE p.slug = 'raw-denim-relaxed-fit-trousers'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Deep Indigo', 'L', 1
FROM products p
WHERE p.slug = 'raw-denim-relaxed-fit-trousers'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Deep Indigo', 'XL', 1
FROM products p
WHERE p.slug = 'raw-denim-relaxed-fit-trousers'
ON CONFLICT (product_id, color, size) DO NOTHING;

-- Product: PLEATED UTILITY NYLON PANTS (pleated-utility-nylon-pants)
INSERT INTO products (name, slug, description, price, category_id, is_active)
SELECT 'PLEATED UTILITY NYLON PANTS', 'pleated-utility-nylon-pants', 'Double forward pleats meet relaxed wide legs for an elevated streetwear statement. Cut from crisp crinkle nylon with deep welt pockets.', 2790, c.id, true
FROM categories c
WHERE c.slug = 'pants'
ON CONFLICT (slug) DO NOTHING;

-- Images for pleated-utility-nylon-pants
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=1200&auto=format&fit=crop&q=85', 'PLEATED UTILITY NYLON PANTS angle 1', 0
FROM products p
WHERE p.slug = 'pleated-utility-nylon-pants'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=1200&auto=format&fit=crop&q=85'
  );
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&auto=format&fit=crop&q=85', 'PLEATED UTILITY NYLON PANTS angle 2', 1
FROM products p
WHERE p.slug = 'pleated-utility-nylon-pants'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&auto=format&fit=crop&q=85'
  );

-- Variants for pleated-utility-nylon-pants
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Matte Black', 'S', 2
FROM products p
WHERE p.slug = 'pleated-utility-nylon-pants'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Matte Black', 'M', 2
FROM products p
WHERE p.slug = 'pleated-utility-nylon-pants'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Matte Black', 'L', 2
FROM products p
WHERE p.slug = 'pleated-utility-nylon-pants'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Matte Black', 'XL', 2
FROM products p
WHERE p.slug = 'pleated-utility-nylon-pants'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Stone', 'S', 2
FROM products p
WHERE p.slug = 'pleated-utility-nylon-pants'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Stone', 'M', 2
FROM products p
WHERE p.slug = 'pleated-utility-nylon-pants'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Stone', 'L', 2
FROM products p
WHERE p.slug = 'pleated-utility-nylon-pants'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Stone', 'XL', 2
FROM products p
WHERE p.slug = 'pleated-utility-nylon-pants'
ON CONFLICT (product_id, color, size) DO NOTHING;

-- Product: ARCHIVAL EMBROIDERED DAD CAP (archival-embroidered-dad-cap)
INSERT INTO products (name, slug, description, price, category_id, is_active)
SELECT 'ARCHIVAL EMBROIDERED DAD CAP', 'archival-embroidered-dad-cap', 'Unstructured 6-panel cap in heavy washed cotton twill. Low-profile silhouette with tonal 3D DOMPI embroidery and antique brass buckle closure.', 1190, c.id, true
FROM categories c
WHERE c.slug = 'accessories'
ON CONFLICT (slug) DO NOTHING;

-- Images for archival-embroidered-dad-cap
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&auto=format&fit=crop&q=85', 'ARCHIVAL EMBROIDERED DAD CAP angle 1', 0
FROM products p
WHERE p.slug = 'archival-embroidered-dad-cap'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&auto=format&fit=crop&q=85'
  );
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&auto=format&fit=crop&q=85', 'ARCHIVAL EMBROIDERED DAD CAP angle 2', 1
FROM products p
WHERE p.slug = 'archival-embroidered-dad-cap'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&auto=format&fit=crop&q=85'
  );

-- Variants for archival-embroidered-dad-cap
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Washed Black', 'ONE SIZE', 8
FROM products p
WHERE p.slug = 'archival-embroidered-dad-cap'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Bone', 'ONE SIZE', 8
FROM products p
WHERE p.slug = 'archival-embroidered-dad-cap'
ON CONFLICT (product_id, color, size) DO NOTHING;

-- Product: BALLISTIC WEBBING UTILITY BELT (ballistic-webbing-utility-belt)
INSERT INTO products (name, slug, description, price, category_id, is_active)
SELECT 'BALLISTIC WEBBING UTILITY BELT', 'ballistic-webbing-utility-belt', 'Heavy-duty 38mm mil-spec nylon webbing belt featuring a quick-release magnetic cobra-style buckle with laser-etched DOMPI typography.', 1290, c.id, true
FROM categories c
WHERE c.slug = 'accessories'
ON CONFLICT (slug) DO NOTHING;

-- Images for ballistic-webbing-utility-belt
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&auto=format&fit=crop&q=85', 'BALLISTIC WEBBING UTILITY BELT angle 1', 0
FROM products p
WHERE p.slug = 'ballistic-webbing-utility-belt'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&auto=format&fit=crop&q=85'
  );
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&auto=format&fit=crop&q=85', 'BALLISTIC WEBBING UTILITY BELT angle 2', 1
FROM products p
WHERE p.slug = 'ballistic-webbing-utility-belt'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_url = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&auto=format&fit=crop&q=85'
  );

-- Variants for ballistic-webbing-utility-belt
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Stealth Black', 'ONE SIZE', 4
FROM products p
WHERE p.slug = 'ballistic-webbing-utility-belt'
ON CONFLICT (product_id, color, size) DO NOTHING;
INSERT INTO product_variants (product_id, color, size, stock)
SELECT p.id, 'Gunmetal', 'ONE SIZE', 4
FROM products p
WHERE p.slug = 'ballistic-webbing-utility-belt'
ON CONFLICT (product_id, color, size) DO NOTHING;

