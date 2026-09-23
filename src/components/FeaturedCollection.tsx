import Image from "next/image";
import Link from "next/link";
import { ProductWithVariants } from "@/lib/catalog";

interface FeaturedCollectionProps {
  product?: ProductWithVariants | null;
}

export default function FeaturedCollection({ product }: FeaturedCollectionProps) {
  // Deterministic rule: Showcase the newest active product from the catalog, with clean editorial fallback if empty
  const title = product?.name || "ARCHITECTURAL TEXTURES // DROP 01";
  const season = "CURATED ARCHIVE // LATEST DROP";
  const description =
    product?.description ||
    "A radical dialogue between brutalist silhouettes and luxurious utilitarian fibers. Heavy gauge knits, structural outerwear, and unyielding dark tones constructed for relentless city environments.";
  const image =
    product?.image ||
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600&auto=format&fit=crop&q=85";
  const cta = "DISCOVER THE DROP";

  return (
    <section className="w-full py-16 sm:py-20 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-black text-white rounded-[8px] overflow-hidden">
          {/* Editorial Image */}
          <div className="lg:col-span-7 relative h-[420px] sm:h-[500px] lg:h-[560px] w-full">
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-center grayscale contrast-115"
            />
          </div>

          {/* Copy & CTA */}
          <div className="lg:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col justify-center space-y-4 sm:space-y-6">
            <span className="text-[11px] font-bold tracking-[0.25em] text-neutral-400 uppercase">
              {season}
            </span>

            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-tight text-white">
              {title}
            </h2>

            <p className="text-sm text-neutral-300 font-normal leading-relaxed tracking-tight">
              {description}
            </p>

            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-[8px] hover:bg-neutral-200 transition-colors"
              >
                {cta}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
