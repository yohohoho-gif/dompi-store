import Image from "next/image";

export default function BrandStory() {
  return (
    <section id="brand-story" className="w-full py-16 sm:py-24 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <span className="text-[11px] font-bold tracking-[0.25em] text-neutral-400 uppercase block mb-2">
                THE MANIFESTO
              </span>
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-black leading-tight">
                BORN FROM CONCRETE.
                <br />
                DEFINED BY PRECISION.
              </h2>
            </div>

            <p className="text-sm sm:text-base text-neutral-600 font-normal leading-relaxed tracking-tight">
              DOMPI was founded as an antithesis to disposable hype fashion. We treat streetwear as modern architectural design: eliminating unnecessary noise, focusing on structured silhouettes, heavyweight organic textiles, and unapologetic monochrome purity.
            </p>

            <p className="text-sm sm:text-base text-neutral-600 font-normal leading-relaxed tracking-tight">
              Every garment is tailored to move with intention. We do not chase seasons; we build permanent wardrobe foundations engineered for those who demand authority in every detail.
            </p>

            {/* Brand Pillars */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200">
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-black block">
                  100%
                </span>
                <span className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                  Heavy Organic
                </span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-black block">
                  00 //
                </span>
                <span className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                  Zero Compromise
                </span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-black block">
                  LTD
                </span>
                <span className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                  Numbered Drops
                </span>
              </div>
            </div>
          </div>

          {/* Editorial Visual Grid */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="relative aspect-[3/4] w-full rounded-[8px] overflow-hidden border border-neutral-200 bg-neutral-100">
              <Image
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80"
                alt="DOMPI Craftsmanship"
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover grayscale contrast-110"
              />
            </div>
            <div className="relative aspect-[3/4] w-full rounded-[8px] overflow-hidden border border-neutral-200 bg-neutral-100 mt-6 sm:mt-10">
              <Image
                src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80"
                alt="DOMPI Streetwear Aesthetic"
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover grayscale contrast-110"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
