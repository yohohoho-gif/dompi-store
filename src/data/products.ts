export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  image: string;
  images: string[];
  description: string;
  tag?: string;
  isNew?: boolean;
  featured?: boolean;
  createdAt?: string;
  colors: ProductColor[];
  sizes: string[];
  stock: number;
  materials: string;
  sizeGuide: string;
  shippingReturns: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
  image: string;
}

export const ALL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    slug: "raw-edges-oversized-tee",
    name: "RAW EDGES OVERSIZED TEE",
    category: "T-Shirts",
    price: 1890,
    currency: "THB",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&auto=format&fit=crop&q=85",
    ],
    description:
      "Crafted from 280 GSM heavyweight dry cotton jersey with unrefined raw seam detailing. Built with a relaxed dropped shoulder and boxy architectural drape that holds its structure throughout all-day wear.",
    tag: "NEW",
    isNew: true,
    featured: true,
    createdAt: "2026-03-01",
    colors: [
      { name: "Vintage Black", hex: "#171717" },
      { name: "Chalk White", hex: "#F5F5F5" },
      { name: "Concrete Gray", hex: "#737373" },
    ],
    sizes: ["S", "M", "L", "XL"],
    stock: 14,
    materials:
      "100% Combed Heavyweight Organic Cotton. 280 GSM. Pre-shrunk finish. Cold machine wash inside out. Do not tumble dry.",
    sizeGuide:
      "Oversized fit. We recommend ordering your true size for intended relaxed streetwear silhouette, or size down for a standard tailored fit.",
    shippingReturns:
      "Complimentary standard shipping on all orders over THB 2,500. Free 14-day domestic returns and exchanges in original unworn condition with tags attached.",
  },
  {
    id: "prod-2",
    slug: "heavyweight-archival-hoodie",
    name: "HEAVYWEIGHT ARCHIVAL HOODIE",
    category: "Hoodies",
    price: 3490,
    currency: "THB",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=1200&auto=format&fit=crop&q=85",
    ],
    description:
      "Substantial 500 GSM custom fleece with a double-layered structured hood that stands upright without drawstrings. Reinforced ribbing at cuffs and hem with flatlock seam construction.",
    tag: "ESSENTIAL",
    isNew: true,
    featured: true,
    createdAt: "2026-03-05",
    colors: [
      { name: "Jet Black", hex: "#0A0A0A" },
      { name: "Heather Slate", hex: "#525252" },
      { name: "Off White", hex: "#E5E5E5" },
    ],
    sizes: ["S", "M", "L", "XL"],
    stock: 8,
    materials:
      "100% French Terry Loopback Cotton. 500 GSM. Rib trims: 95% Cotton, 5% Elastane. Machine wash cold with similar dark colors.",
    sizeGuide:
      "Boxy and structured body with wide sleeves. Fits true to size for contemporary streetwear proportions.",
    shippingReturns:
      "Complimentary standard shipping on all orders over THB 2,500. Free 14-day domestic returns and exchanges in original unworn condition with tags attached.",
  },
  {
    id: "prod-3",
    slug: "modular-cargo-track-pants",
    name: "MODULAR CARGO TRACK PANTS",
    category: "Pants",
    price: 2990,
    currency: "THB",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=1200&auto=format&fit=crop&q=85",
    ],
    description:
      "Multi-pocket tactical track pants engineered in water-resistant matte nylon ripstop. Equipped with cinchable ankle toggles, deep bellows cargo compartments, and an integrated industrial webbing belt.",
    tag: "LIMITED",
    isNew: true,
    featured: true,
    createdAt: "2026-02-28",
    colors: [
      { name: "Onyx Black", hex: "#111111" },
      { name: "Cement Gray", hex: "#737373" },
    ],
    sizes: ["S", "M", "L", "XL"],
    stock: 6,
    materials:
      "100% Technical Nylon Ripstop with DWR coating. YKK matte hardware. Wipe clean or machine wash cold gentle cycle.",
    sizeGuide:
      "Elastic waistband with drawcord adjustment fits waist sizes S (28-30), M (31-33), L (34-36), XL (37-39).",
    shippingReturns:
      "Complimentary standard shipping on all orders over THB 2,500. Free 14-day domestic returns and exchanges in original unworn condition with tags attached.",
  },
  {
    id: "prod-4",
    slug: "tactical-monochrome-crossbody",
    name: "TACTICAL MONOCHROME CROSSBODY",
    category: "Accessories",
    price: 1590,
    currency: "THB",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&auto=format&fit=crop&q=85",
    ],
    description:
      "Compact modular crossbody bag constructed from 1000D ballistic cordura. Features water-tight sealed zippers, an internal organizer sleeve, and an adjustable quick-release tactical buckle strap.",
    tag: "ESSENTIAL",
    featured: true,
    createdAt: "2026-02-20",
    colors: [
      { name: "Pure Black", hex: "#000000" },
      { name: "Stealth Slate", hex: "#404040" },
    ],
    sizes: ["ONE SIZE"],
    stock: 19,
    materials:
      "1000D Cordura Nylon with PU backing. Matte zinc alloy hardware. Wipe clean with damp cloth.",
    sizeGuide:
      "Dimensions: 22cm W x 16cm H x 6cm D. Strap length adjustable from 60cm to 125cm.",
    shippingReturns:
      "Complimentary standard shipping on all orders over THB 2,500. Free 14-day domestic returns and exchanges in original unworn condition with tags attached.",
  },
  {
    id: "prod-5",
    slug: "box-cut-acid-wash-tee",
    name: "BOX CUT ACID WASH TEE",
    category: "T-Shirts",
    price: 1690,
    currency: "THB",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop&q=85",
    ],
    description:
      "Individually hand-treated acid wash tee offering unique marble grain patterns on each garment. High-density ribbed collar and reinforced shoulder tape.",
    tag: "POPULAR",
    featured: false,
    createdAt: "2026-01-15",
    colors: [
      { name: "Acid Charcoal", hex: "#262626" },
      { name: "Acid Ash", hex: "#525252" },
    ],
    sizes: ["S", "M", "L", "XL"],
    stock: 11,
    materials: "100% Organic Cotton. 240 GSM. Hand wash cold recommended.",
    sizeGuide: "Boxy fit. Order true size.",
    shippingReturns:
      "Complimentary standard shipping on all orders over THB 2,500. Free 14-day domestic returns.",
  },
  {
    id: "prod-6",
    slug: "minimalist-logo-graphic-tee",
    name: "MINIMALIST LOGO GRAPHIC TEE",
    category: "T-Shirts",
    price: 1490,
    currency: "THB",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop&q=85",
    ],
    description:
      "Tonal matte silicone high-density DOMPI chest logo. Ultra-soft combed cotton weave with a tailored neckline and relaxed torso.",
    createdAt: "2026-01-10",
    colors: [
      { name: "Pitch Black", hex: "#0A0A0A" },
      { name: "Ghost White", hex: "#FAFAFA" },
    ],
    sizes: ["S", "M", "L", "XL"],
    stock: 22,
    materials: "100% Combed Cotton. 220 GSM.",
    sizeGuide: "True to size.",
    shippingReturns:
      "Complimentary standard shipping on all orders over THB 2,500. Free 14-day domestic returns.",
  },
  {
    id: "prod-7",
    slug: "drop-shoulder-thermal-hoodie",
    name: "DROP SHOULDER THERMAL HOODIE",
    category: "Hoodies",
    price: 3690,
    currency: "THB",
    image: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&auto=format&fit=crop&q=85",
    ],
    description:
      "Waffle-knit thermal-lined pullover hoodie providing superior heat retention without excess bulk. Kangaroo pocket with hidden internal phone pouch.",
    tag: "RESTOCKED",
    featured: true,
    createdAt: "2026-02-14",
    colors: [
      { name: "Matte Black", hex: "#171717" },
      { name: "Heather Gray", hex: "#737373" },
    ],
    sizes: ["S", "M", "L", "XL"],
    stock: 7,
    materials: "Body: 100% Heavy Cotton. Lining: 100% Cotton Waffle Knit.",
    sizeGuide: "Relaxed drop shoulder cut.",
    shippingReturns:
      "Complimentary standard shipping on all orders over THB 2,500. Free 14-day domestic returns.",
  },
  {
    id: "prod-8",
    slug: "structural-zip-up-tech-hoodie",
    name: "STRUCTURAL ZIP-UP TECH HOODIE",
    category: "Hoodies",
    price: 3890,
    currency: "THB",
    image: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&auto=format&fit=crop&q=85",
    ],
    description:
      "Full two-way front metal zipper with high-stance funnel neckline. Raglan sleeve articulation for maximum arm mobility and minimalist side-seam hand pockets.",
    tag: "NEW",
    isNew: true,
    createdAt: "2026-03-02",
    colors: [
      { name: "Carbon", hex: "#1C1917" },
      { name: "Off White", hex: "#F5F5F4" },
    ],
    sizes: ["S", "M", "L", "XL"],
    stock: 5,
    materials: "90% Cotton, 10% Technical Polyamide. 480 GSM.",
    sizeGuide: "True to size tailored architectural fit.",
    shippingReturns:
      "Complimentary standard shipping on all orders over THB 2,500. Free 14-day domestic returns.",
  },
  {
    id: "prod-9",
    slug: "raw-denim-relaxed-fit-trousers",
    name: "RAW DENIM RELAXED FIT TROUSERS",
    category: "Pants",
    price: 3290,
    currency: "THB",
    image: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&auto=format&fit=crop&q=85",
    ],
    description:
      "14.5 oz Japanese selvedge raw indigo denim. Unwashed stiff hand-feel designed to fade naturally with your personal wear patterns over time.",
    featured: false,
    createdAt: "2026-01-22",
    colors: [
      { name: "Raw Black Denim", hex: "#141414" },
      { name: "Deep Indigo", hex: "#1E293B" },
    ],
    sizes: ["S", "M", "L", "XL"],
    stock: 9,
    materials: "100% Selvedge Cotton Denim. 14.5 oz.",
    sizeGuide: "Straight leg with slight taper. Order true waist size.",
    shippingReturns:
      "Complimentary standard shipping on all orders over THB 2,500. Free 14-day domestic returns.",
  },
  {
    id: "prod-10",
    slug: "pleated-utility-nylon-pants",
    name: "PLEATED UTILITY NYLON PANTS",
    category: "Pants",
    price: 2790,
    currency: "THB",
    image: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&auto=format&fit=crop&q=85",
    ],
    description:
      "Double forward pleats meet relaxed wide legs for an elevated streetwear statement. Cut from crisp crinkle nylon with deep welt pockets.",
    tag: "ESSENTIAL",
    createdAt: "2026-02-05",
    colors: [
      { name: "Matte Black", hex: "#171717" },
      { name: "Stone", hex: "#A8A29E" },
    ],
    sizes: ["S", "M", "L", "XL"],
    stock: 13,
    materials: "100% Recycled Crinkle Nylon.",
    sizeGuide: "Wide leg silhouette with elastic back waist.",
    shippingReturns:
      "Complimentary standard shipping on all orders over THB 2,500. Free 14-day domestic returns.",
  },
  {
    id: "prod-11",
    slug: "archival-embroidered-dad-cap",
    name: "ARCHIVAL EMBROIDERED DAD CAP",
    category: "Accessories",
    price: 1190,
    currency: "THB",
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&auto=format&fit=crop&q=85",
    ],
    description:
      "Unstructured 6-panel cap in heavy washed cotton twill. Low-profile silhouette with tonal 3D DOMPI embroidery and antique brass buckle closure.",
    createdAt: "2026-01-08",
    colors: [
      { name: "Washed Black", hex: "#262626" },
      { name: "Bone", hex: "#E7E5E4" },
    ],
    sizes: ["ONE SIZE"],
    stock: 15,
    materials: "100% Cotton Twill with brass buckle strap.",
    sizeGuide: "Adjustable back strap fits head circumferences 54cm-61cm.",
    shippingReturns:
      "Complimentary standard shipping on all orders over THB 2,500. Free 14-day domestic returns.",
  },
  {
    id: "prod-12",
    slug: "ballistic-webbing-utility-belt",
    name: "BALLISTIC WEBBING UTILITY BELT",
    category: "Accessories",
    price: 1290,
    currency: "THB",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&auto=format&fit=crop&q=85",
    ],
    description:
      "Heavy-duty 38mm mil-spec nylon webbing belt featuring a quick-release magnetic cobra-style buckle with laser-etched DOMPI typography.",
    tag: "LIMITED",
    isNew: true,
    createdAt: "2026-02-25",
    colors: [
      { name: "Stealth Black", hex: "#0F172A" },
      { name: "Gunmetal", hex: "#475569" },
    ],
    sizes: ["ONE SIZE"],
    stock: 8,
    materials: "100% High-Tensile Nylon Webbing. Alloy Buckle.",
    sizeGuide: "Total length 130cm, fully adjustable to any waist size.",
    shippingReturns:
      "Complimentary standard shipping on all orders over THB 2,500. Free 14-day domestic returns.",
  },
];

export const NEW_ARRIVALS: Product[] = ALL_PRODUCTS.slice(0, 4);

export const CATEGORIES: Category[] = [
  {
    id: "cat-1",
    name: "T-Shirts",
    slug: "t-shirts",
    itemCount: 14,
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "cat-2",
    name: "Hoodies",
    slug: "hoodies",
    itemCount: 9,
    image: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "cat-3",
    name: "Pants",
    slug: "pants",
    itemCount: 12,
    image: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "cat-4",
    name: "Accessories",
    slug: "accessories",
    itemCount: 18,
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80",
  },
];

export const FEATURED_COLLECTION = {
  season: "AUTUMN / WINTER 2026",
  title: "PROJECT 01 // MONOLITH",
  description:
    "An architectural exploration of heavy textiles, relaxed geometry, and raw utilitarian detailing. Crafted in limited quantities with Japanese dry cotton and recycled ripstop.",
  image: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=1600&auto=format&fit=crop&q=80",
  cta: "SHOP COLLECTION",
};

export function getProductBySlug(slug: string): Product | undefined {
  const decoded = decodeURIComponent(slug).toLowerCase();
  return ALL_PRODUCTS.find(
    (p) => p.slug.toLowerCase() === decoded || p.id.toLowerCase() === decoded
  );
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const sameCategory = ALL_PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  );
  if (sameCategory.length >= limit) {
    return sameCategory.slice(0, limit);
  }
  const others = ALL_PRODUCTS.filter(
    (p) => p.id !== product.id && !sameCategory.some((sc) => sc.id === p.id)
  );
  return [...sameCategory, ...others].slice(0, limit);
}
