import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/data/products";

export default function ShopByCategory() {
  return (
    <section id="shop" className="w-full py-16 sm:py-20 bg-neutral-50 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 pb-4 border-b border-neutral-200">
          <span className="text-[11px] font-bold tracking-[0.2em] text-neutral-400 uppercase block mb-1">
            EXPLORE THE SPECTRUM
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-black uppercase">
            SHOP BY CATEGORY
          </h2>
        </div>

        {/* 4 Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`#category-${cat.slug}`}
              className="group relative block aspect-[4/5] bg-neutral-200 rounded-[8px] overflow-hidden border border-neutral-200"
            >
              {/* Category Image */}
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover object-center grayscale contrast-110 group-hover:scale-105 transition-transform duration-500"
              />

              {/* Monochrome Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-300 group-hover:opacity-90" />

              {/* Text Information */}
              <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400">
                  {cat.itemCount} PIECES
                </span>
                <h3 className="text-xl font-black tracking-tighter uppercase text-white mt-1">
                  {cat.name}
                </h3>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white group-hover:underline underline-offset-4">
                  EXPLORE CATEGORY
                  <span aria-hidden="true">&rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
