import Link from "next/link";

export default function Footer() {
  return (
    <footer id="footer" className="w-full bg-white text-black border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info Column */}
          <div className="col-span-2 space-y-4">
            <Link
              href="/"
              className="text-3xl font-black tracking-tighter uppercase text-black inline-block"
            >
              DOMPI
            </Link>
            <p className="text-xs text-neutral-500 max-w-sm leading-relaxed tracking-tight">
              Original premium streetwear fashion house. Minimalist geometry, heavyweight fabrics, and unapologetic monochrome aesthetics.
            </p>
            <div className="pt-2 text-xs font-semibold tracking-wider text-black uppercase">
              STUDIO: BANGKOK / TOKYO / WORLDWIDE
            </div>
          </div>

          {/* Shop Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest uppercase text-black">
              COLLECTION
            </h4>
            <ul className="space-y-2 text-xs text-neutral-500 font-medium">
              <li>
                <Link href="/shop" className="hover:text-black transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-black transition-colors">
                  T-Shirts
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-black transition-colors">
                  Hoodies & Sweats
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-black transition-colors">
                  Pants & Denim
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-black transition-colors">
                  Accessories
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest uppercase text-black">
              CLIENT CARE
            </h4>
            <ul className="space-y-2 text-xs text-neutral-500 font-medium">
              <li>
                <a href="#order-status" className="hover:text-black transition-colors">
                  Track Order
                </a>
              </li>
              <li>
                <a href="#shipping" className="hover:text-black transition-colors">
                  Shipping & Customs
                </a>
              </li>
              <li>
                <a href="#returns" className="hover:text-black transition-colors">
                  Returns & Exchanges
                </a>
              </li>
              <li>
                <a href="#sizing" className="hover:text-black transition-colors">
                  Size Guide
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-black transition-colors">
                  Contact Studio
                </a>
              </li>
            </ul>
          </div>

          {/* Connect Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest uppercase text-black">
              SOCIAL
            </h4>
            <ul className="space-y-2 text-xs text-neutral-500 font-medium">
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">
                  TikTok
                </a>
              </li>
              <li>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">
                  X / Twitter
                </a>
              </li>
              <li>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">
                  YouTube
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400">
          <div>
            &copy; {new Date().getFullYear()} DOMPI APPAREL CO. ALL RIGHTS RESERVED.
          </div>
          <div className="flex gap-6 font-medium">
            <a href="#privacy" className="hover:text-black transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-black transition-colors">
              Terms of Service
            </a>
            <a href="#accessibility" className="hover:text-black transition-colors">
              Accessibility
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
