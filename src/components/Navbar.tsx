"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";
import { customerLogoutAction } from "@/app/actions/auth";

export default function Navbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { totalItems, isHydrated } = useCart();
  const displayCartCount = isHydrated ? totalItems : 0;

  useEffect(() => {
    const supabase = createClient();

    // Check initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });

    // Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleMobileSignOut = async () => {
    setMobileMenuOpen(false);
    const res = await customerLogoutAction();
    if (res.success) {
      router.push("/");
      router.refresh();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setSearchOpen(false);
    setSearchQuery("");
    router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-neutral-200">
      {/* Top Banner */}
      <div className="bg-black text-white text-[11px] font-medium tracking-widest uppercase py-1.5 px-4 text-center">
        Worldwide Express Shipping &bull; Free Returns Within 14 Days
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <div className="flex items-center lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-black hover:text-neutral-600 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Brand Logo */}
        <div className="flex items-center">
          <Link
            href="/"
            className="text-2xl sm:text-3xl font-black tracking-tighter text-black uppercase select-none hover:opacity-80 transition-opacity"
          >
            DOMPI
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link
            href="/shop"
            className="text-xs font-semibold tracking-wider text-black uppercase hover:text-neutral-500 transition-colors"
          >
            SHOP
          </Link>
          <Link
            href="/#new-arrivals"
            className="text-xs font-semibold tracking-wider text-black uppercase hover:text-neutral-500 transition-colors"
          >
            NEW ARRIVALS
          </Link>
          <Link
            href="/#brand-story"
            className="text-xs font-semibold tracking-wider text-black uppercase hover:text-neutral-500 transition-colors"
          >
            ABOUT
          </Link>
          <Link
            href="/#footer"
            className="text-xs font-semibold tracking-wider text-black uppercase hover:text-neutral-500 transition-colors"
          >
            CONTACT
          </Link>
        </nav>

        {/* Action Icons: Search, Account, Cart */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Search Button */}
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 text-black hover:text-neutral-500 rounded-[8px] transition-colors"
            aria-label={searchOpen ? "Close search bar" : "Open search bar"}
            aria-expanded={searchOpen}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>

          {/* Customer Account Link */}
          <Link
            href={isAuthenticated ? "/account" : "/login"}
            className="relative p-2 text-black hover:text-neutral-500 rounded-[8px] transition-colors inline-block"
            aria-label={isAuthenticated ? "My Account" : "Sign In"}
            title={isAuthenticated ? "My Account" : "Sign In"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            {isAuthenticated && (
              <span
                className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full"
                title="Active Session"
              />
            )}
          </Link>

          {/* Cart Link */}
          <Link
            href="/cart"
            className="relative p-2 text-black hover:text-neutral-500 rounded-[8px] transition-colors inline-block"
            aria-label={`Cart with ${displayCartCount} items`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.67 0-1.19-.578-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
            <span className="absolute top-1 right-1 w-4 h-4 bg-black text-white text-[10px] font-bold flex items-center justify-center rounded-full">
              {displayCartCount}
            </span>
          </Link>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {searchOpen && (
        <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-3">
          <form
            role="search"
            onSubmit={handleSearchSubmit}
            className="max-w-xl mx-auto flex items-center gap-2"
          >
            <label htmlFor="navbar-search-input" className="sr-only">
              Search products
            </label>
            <input
              id="navbar-search-input"
              type="search"
              name="q"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, collections, categories..."
              className="flex-1 bg-white border border-neutral-300 rounded-[8px] px-4 py-2 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-black"
            >
              Close
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white px-6 py-6 space-y-5">
          <div className="flex flex-col space-y-3">
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold tracking-wider uppercase text-black hover:text-neutral-500 py-1"
            >
              SHOP
            </Link>
            <Link
              href="/#new-arrivals"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold tracking-wider uppercase text-black hover:text-neutral-500 py-1"
            >
              NEW ARRIVALS
            </Link>
            <Link
              href="/#brand-story"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold tracking-wider uppercase text-black hover:text-neutral-500 py-1"
            >
              ABOUT
            </Link>
            <Link
              href="/#footer"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold tracking-wider uppercase text-black hover:text-neutral-500 py-1"
            >
              CONTACT
            </Link>
          </div>

          {/* Mobile Auth Links */}
          <div className="pt-4 border-t border-neutral-200 flex flex-col space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold tracking-wider uppercase text-black hover:text-neutral-500 py-1.5 flex items-center justify-between"
                >
                  <span>MY ACCOUNT</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </Link>
                <button
                  type="button"
                  onClick={handleMobileSignOut}
                  className="text-xs font-bold tracking-wider uppercase text-neutral-500 hover:text-red-600 text-left py-1"
                >
                  SIGN OUT
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold tracking-wider uppercase text-black hover:text-neutral-500"
                >
                  SIGN IN
                </Link>
                <span className="text-neutral-300">&bull;</span>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold tracking-wider uppercase text-neutral-500 hover:text-black"
                >
                  CREATE ACCOUNT
                </Link>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-neutral-100 flex gap-4 text-xs font-medium text-neutral-400">
            <span>CURRENCY: THB (฿)</span>
            <span>EN / TH</span>
          </div>
        </div>
      )}
    </header>
  );
}
