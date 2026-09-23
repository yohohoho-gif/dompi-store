import Image from "next/image";
import Link from "next/link";
import { ProductWithVariants } from "@/lib/catalog";

interface NewArrivalsProps {
  products: ProductWithVariants[];
}

export default function NewArrivals({ products }: NewArrivalsProps) {
  return (
    <section id="new-arrivals" className="w-full py-16 sm:py-20 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-neutral-200 gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-[0.2em] text-neutral-400 uppercase block mb-1">
              CURATED DROPS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-black uppercase">
              NEW ARRIVALS
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold tracking-wider text-black uppercase hover:text-neutral-500 transition-colors inline-flex items-center gap-1.5"
          >
            VIEW ALL PRODUCTS
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {/* Products Grid or Empty Fallback */}
        {products.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-neutral-200 rounded-[8px]">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              No new arrivals currently available
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {products.map((product) => {
              const variants = product.variants;
              const isSoldOut =
                variants && variants.length > 0
                  ? variants.every((v) => (v.stock || 0) <= 0)
                  : (product.stock ?? 0) <= 0;

              return (
                <div
                  key={product.id}
                  className="group flex flex-col bg-white border border-neutral-200 rounded-[8px] overflow-hidden"
                >
                  {/* Product Image Container */}
                  <Link
                    href={`/shop/${product.slug}`}
                    className="relative aspect-[3/4] w-full bg-neutral-100 overflow-hidden block"
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500 grayscale contrast-105"
                    />

                    {/* Badge Tag */}
                    {isSoldOut ? (
                      <div className="absolute top-3 left-3 bg-neutral-900 text-neutral-300 text-[10px] font-bold tracking-widest px-2.5 py-1 uppercase rounded-[4px]">
                        SOLD OUT
                      </div>
                    ) : product.tag ? (
                      <div className="absolute top-3 left-3 bg-black text-white text-[10px] font-bold tracking-widest px-2.5 py-1 uppercase rounded-[4px]">
                        {product.tag}
                      </div>
                    ) : null}
                  </Link>

                  {/* Product Information */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-3 bg-white">
                    <div>
                      <span className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase">
                        {product.category}
                      </span>
                      <Link href={`/shop/${product.slug}`} className="block">
                        <h3 className="text-xs font-bold tracking-tight text-black uppercase mt-0.5 group-hover:text-neutral-600 transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                      </Link>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                      <span className="text-sm font-black tracking-tight text-black">
                        {product.currency} {product.price.toLocaleString()}
                      </span>
                      {isSoldOut ? (
                        <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-400 select-none">
                          SOLD OUT
                        </span>
                      ) : (
                        <Link
                          href={`/shop/${product.slug}`}
                          className="text-[11px] font-bold tracking-wider uppercase text-black hover:text-neutral-500 underline underline-offset-4"
                        >
                          SELECT OPTIONS
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
