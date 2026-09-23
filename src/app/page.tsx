import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import NewArrivals from "@/components/NewArrivals";
import ShopByCategory, { CategoryCardData } from "@/components/ShopByCategory";
import FeaturedCollection from "@/components/FeaturedCollection";
import BrandStory from "@/components/BrandStory";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import { getSupabaseCatalog } from "@/lib/catalog";

export const revalidate = 0; // Fresh catalog data on request

export default async function Home() {
  const { products, categories } = await getSupabaseCatalog();

  // 1. Derive New Arrivals: top 4 newest active products from catalog
  const newArrivals = products.slice(0, 4);

  // 2. Derive Shop By Category cards from Supabase categories and matching products
  const categoryCards: CategoryCardData[] = categories.map((cat) => {
    const matchingProducts = products.filter(
      (p) =>
        (p.categorySlug && p.categorySlug.toLowerCase() === cat.slug.toLowerCase()) ||
        p.category.toLowerCase() === cat.name.toLowerCase()
    );
    const categoryImage =
      matchingProducts[0]?.image ||
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80";

    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      itemCount: matchingProducts.length,
      image: categoryImage,
    };
  });

  // 3. Derive Featured Product: newest active product from catalog
  const featuredProduct = products.length > 0 ? products[0] : null;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col antialiased selection:bg-black selection:text-white">
      {/* 1. Sticky Navbar */}
      <Navbar />

      <main className="flex-1 w-full">
        {/* 2. Hero Section */}
        <Hero />

        {/* 3. New Arrivals */}
        <NewArrivals products={newArrivals} />

        {/* 4. Shop By Category */}
        <ShopByCategory categories={categoryCards} />

        {/* 5. Featured Collection */}
        <FeaturedCollection product={featuredProduct} />

        {/* 6. Brand Story */}
        <BrandStory />

        {/* 7. Newsletter */}
        <Newsletter />
      </main>

      {/* 8. Footer */}
      <Footer />
    </div>
  );
}
