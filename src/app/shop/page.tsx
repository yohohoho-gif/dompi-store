import { Suspense } from "react";
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

interface ShopPageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const resolvedParams = await searchParams;
  const category =
    typeof resolvedParams?.category === "string"
      ? resolvedParams.category
      : undefined;
  const q =
    typeof resolvedParams?.q === "string"
      ? resolvedParams.q
      : undefined;
  const { products, categories } = await getSupabaseCatalog();

  return (
    <div className="min-h-screen bg-white text-black flex flex-col antialiased selection:bg-black selection:text-white">
      {/* Sticky Navbar */}
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <Suspense fallback={null}>
          <ShopCatalog
            initialProducts={products}
            categories={categories}
            initialCategory={category}
            initialQuery={q}
          />
        </Suspense>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
