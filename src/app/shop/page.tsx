import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShopCatalog from "@/components/ShopCatalog";
import { getSupabaseCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop All Architectural Streetwear | DOMPI",
  description:
    "Explore the complete DOMPI streetwear catalog archive. Curated heavyweight organic silhouettes, hoodies, cargo track pants, and tactical accessories.",
};

export const revalidate = 0; // Fresh catalog data on request

export default async function ShopPage() {
  const { products, categories } = await getSupabaseCatalog();

  return (
    <div className="min-h-screen bg-white text-black flex flex-col antialiased selection:bg-black selection:text-white">
      {/* Sticky Navbar */}
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <ShopCatalog initialProducts={products} categories={categories} />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
