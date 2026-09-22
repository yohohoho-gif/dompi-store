import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative w-full bg-neutral-100 overflow-hidden">
      <div className="relative w-full h-[78vh] min-h-[540px] max-h-[820px]">
        {/* Background Fashion Image */}
        <Image
          src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=2000&auto=format&fit=crop&q=85"
          alt="DOMPI Streetwear New Collection"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center grayscale contrast-110 brightness-90"
        />

        {/* Flat Minimalist Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        {/* Content Box */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 lg:p-16 max-w-7xl mx-auto">
          <div className="max-w-2xl text-white space-y-3 sm:space-y-4">
            <span className="inline-block text-xs sm:text-sm font-bold tracking-[0.25em] uppercase text-neutral-300">
              NEW COLLECTION
            </span>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.95]">
              YOUR STYLE.
              <br />
              YOUR WAY.
            </h1>

            <p className="text-sm sm:text-base text-neutral-300 font-normal max-w-lg tracking-tight pt-1">
              Engineered silhouettes designed for contemporary street culture. Heavyweight fabrics, architectural proportions, and zero compromise.
            </p>

            <div className="pt-3 sm:pt-5">
              <Link
                href="#shop"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-[8px] hover:bg-neutral-200 transition-colors"
              >
                SHOP NOW
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
