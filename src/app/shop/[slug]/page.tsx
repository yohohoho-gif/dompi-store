import { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductDetailView from "@/components/ProductDetailView";
import {
  getSupabaseProductBySlug,
  getSupabaseRelatedProducts,
  getSupabaseProductSlugs,
} from "@/lib/catalog";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getSupabaseProductSlugs();
  return slugs;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getSupabaseProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | DOMPI",
      description: "The requested DOMPI piece could not be located in our archive.",
    };
  }

  return {
    title: `${product.name} | DOMPI Streetwear`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getSupabaseProductBySlug(slug);

  if (!product) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto px-4 py-24 text-center flex flex-col items-center justify-center">
          <span className="text-[11px] font-bold tracking-[0.25em] text-neutral-400 uppercase mb-2">
            ARCHIVE 404
          </span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-black mb-3">
            PIECE NOT FOUND
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mb-8">
            The streetwear garment you are looking for is either archived or unavailable in this season drop.
          </p>
          <Link
            href="/shop"
            className="px-8 py-3.5 bg-black text-white font-bold text-xs uppercase tracking-widest rounded-[8px] hover:bg-neutral-800 transition-colors"
          >
            RETURN TO SHOP
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const relatedProducts = await getSupabaseRelatedProducts(product, 4);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col antialiased selection:bg-black selection:text-white">
      {/* Sticky Navbar */}
      <Navbar />

      <main className="flex-1 w-full">
        <ProductDetailView product={product} relatedProducts={relatedProducts} />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
