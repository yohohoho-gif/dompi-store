import Image from "next/image";
import Link from "next/link";
import { FEATURED_COLLECTION } from "@/data/products";

export default function FeaturedCollection() {
  return (
    <section className="w-full py-16 sm:py-20 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-black text-white rounded-[8px] overflow-hidden">
          {/* Editorial Image */}
          <div className="lg:col-span-7 relative h-[420px] sm:h-[500px] lg:h-[560px] w-full">
            <Image
              src={FEATURED_COLLECTION.image}
              alt={FEATURED_COLLECTION.title}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-center grayscale contrast-115"
            />
          </div>

          {/* Copy & CTA */}
          <div className="lg:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col justify-center space-y-4 sm:space-y-6">
            <span className="text-[11px] font-bold tracking-[0.25em] text-neutral-400 uppercase">
              {FEATURED_COLLECTION.season}
            </span>

            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-tight text-white">
              {FEATURED_COLLECTION.title}
            </h2>

            <p className="text-sm text-neutral-300 font-normal leading-relaxed tracking-tight">
              {FEATURED_COLLECTION.description}
            </p>

            <div className="pt-2">
              <Link
                href="#shop"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-[8px] hover:bg-neutral-200 transition-colors"
              >
                {FEATURED_COLLECTION.cta}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
