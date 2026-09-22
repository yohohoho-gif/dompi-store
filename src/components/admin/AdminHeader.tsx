"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminLogoutAction } from "@/app/admin/actions";

export default function AdminHeader() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  const navLinks = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/products/new", label: "+ New Piece" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-black text-white border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-lg font-black tracking-tighter uppercase text-white hover:text-neutral-300 transition-colors"
          >
            DOMPI
          </Link>
          <span className="bg-neutral-800 text-neutral-300 text-[10px] font-bold px-2 py-0.5 rounded-[4px] tracking-widest uppercase">
            ADMIN CONSOLE
          </span>
        </div>

        {/* Navigation Tabs (Hidden on Login Page) */}
        {!isLoginPage && (
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-[6px] transition-colors ${
                    isActive
                      ? "bg-white text-black"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Actions: Live Storefront & Sign Out */}
        <div className="flex items-center gap-3">
          <Link
            href="/shop"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            <span>Live Store</span>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </Link>

          {!isLoginPage && (
            <form action={adminLogoutAction}>
              <button
                type="submit"
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded-[6px] transition-colors border border-neutral-800"
              >
                Sign Out
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
