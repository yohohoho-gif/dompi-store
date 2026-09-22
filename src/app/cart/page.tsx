"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    shipping,
    total,
    isHydrated,
  } = useCart();

  // Handle SSR hydration smoothly
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="animate-pulse space-y-4 max-w-sm mx-auto">
            <div className="h-6 bg-neutral-200 rounded-[8px]" />
            <div className="h-4 bg-neutral-100 rounded-[8px]" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const freeShippingThreshold = 2000;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );

  return (
    <div className="min-h-screen bg-white text-black flex flex-col antialiased selection:bg-black selection:text-white">
      {/* Sticky Navbar */}
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Page Header */}
        <header className="mb-10 pb-6 border-b border-neutral-200">
          <span className="text-[11px] font-bold tracking-[0.25em] text-neutral-400 uppercase block mb-1">
            ARCHIVE BAG
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-black uppercase">
            YOUR CART
          </h1>
        </header>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="py-20 sm:py-28 text-center border border-dashed border-neutral-200 rounded-[8px] my-6">
            <div className="w-12 h-12 mx-auto mb-4 text-neutral-300 flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.67 0-1.19-.578-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-black mb-2">
              YOUR CART IS EMPTY
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto mb-8 tracking-tight">
              You currently have no pieces in your archive bag. Explore our latest drops and architectural essentials.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-[8px] hover:bg-neutral-800 transition-colors"
            >
              CONTINUE SHOPPING
            </Link>
          </div>
        ) : (
          /* 2-Column Responsive Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left Column: Cart Items List (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Free Shipping Progress Indicator */}
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-[8px]">
                <div className="flex justify-between items-center text-xs font-bold tracking-tight uppercase mb-2">
                  <span>
                    {amountToFreeShipping === 0 ? (
                      <span className="text-black font-black">
                        ✓ QUALIFIED FOR FREE EXPRESS SHIPPING
                      </span>
                    ) : (
                      <span>
                        ADD{" "}
                        <span className="text-black font-black">
                          THB {amountToFreeShipping.toLocaleString()}
                        </span>{" "}
                        MORE FOR FREE SHIPPING
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {freeShippingProgress}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black transition-all duration-500 rounded-full"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>

              {/* Items Table / List */}
              <div className="divide-y divide-neutral-200 border-y border-neutral-200">
                {items.map((item) => {
                  const itemTotal = item.product.price * item.quantity;
                  return (
                    <div
                      key={item.id}
                      className="py-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
                    >
                      {/* Product Image & Meta */}
                      <div className="flex items-center gap-4 flex-1">
                        <Link
                          href={`/shop/${item.product.slug}`}
                          className="relative w-20 h-24 sm:w-24 sm:h-32 shrink-0 bg-neutral-100 rounded-[8px] overflow-hidden border border-neutral-200 block"
                        >
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            sizes="96px"
                            className="object-cover grayscale contrast-105"
                          />
                        </Link>

                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase block">
                            {item.product.category}
                          </span>
                          <Link
                            href={`/shop/${item.product.slug}`}
                            className="text-xs sm:text-sm font-bold tracking-tight text-black uppercase hover:text-neutral-600 transition-colors block line-clamp-1"
                          >
                            {item.product.name}
                          </Link>
                          <div className="text-[11px] text-neutral-500 font-medium space-x-3 pt-0.5">
                            <span>
                              COLOR: <strong className="text-black font-bold">{item.color}</strong>
                            </span>
                            <span>&bull;</span>
                            <span>
                              SIZE: <strong className="text-black font-bold">{item.size}</strong>
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-neutral-500 sm:hidden pt-1">
                            THB {item.product.price.toLocaleString()} each
                          </div>
                        </div>
                      </div>

                      {/* Controls & Price */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0">
                        {/* Quantity Stepper */}
                        <div className="inline-flex items-center border border-neutral-200 rounded-[8px] bg-white">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2.5 py-1.5 text-xs font-bold text-black hover:bg-neutral-100 rounded-l-[8px] transition-colors"
                            aria-label="Decrease quantity"
                          >
                            &minus;
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-black select-none">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= (item.product.stock || 99)}
                            className="px-2.5 py-1.5 text-xs font-bold text-black hover:bg-neutral-100 disabled:opacity-30 rounded-r-[8px] transition-colors"
                            aria-label="Increase quantity"
                          >
                            &#43;
                          </button>
                        </div>

                        {/* Item Total */}
                        <div className="text-right min-w-[90px]">
                          <span className="text-sm font-black tracking-tight text-black block">
                            THB {itemTotal.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-neutral-400 hidden sm:block">
                            THB {item.product.price.toLocaleString()} each
                          </span>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-neutral-400 hover:text-black rounded-[4px] transition-colors"
                          aria-label={`Remove ${item.product.name} from cart`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Continue Shopping Link */}
              <div className="pt-2">
                <Link
                  href="/shop"
                  className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black transition-colors inline-flex items-center gap-1.5"
                >
                  &larr; CONTINUE BROWSING ARCHIVE
                </Link>
              </div>
            </div>

            {/* Right Column: Order Summary (5 cols sticky) */}
            <div className="lg:col-span-5 bg-neutral-50 border border-neutral-200 rounded-[8px] p-6 sm:p-8 lg:sticky lg:top-24 space-y-6">
              <h2 className="text-lg font-black uppercase tracking-tight text-black pb-4 border-b border-neutral-200">
                ORDER SUMMARY
              </h2>

              <div className="space-y-3 text-xs tracking-tight">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-black">
                    THB {subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span>Shipping</span>
                  <span className="font-bold text-black">
                    {shipping === 0 ? (
                      <span className="text-neutral-900 font-extrabold uppercase">
                        FREE
                      </span>
                    ) : (
                      `THB ${shipping.toLocaleString()}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-neutral-400 text-[11px] pt-1 pb-1">
                  <span>Taxes & Duties</span>
                  <span>Calculated at checkout</span>
                </div>

                <div className="border-t border-neutral-200 pt-4 flex justify-between items-baseline">
                  <span className="text-sm font-black uppercase tracking-wider text-black">
                    ESTIMATED TOTAL
                  </span>
                  <span className="text-2xl font-black tracking-tight text-black">
                    THB {total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout Action */}
              <div className="pt-2 space-y-3">
                <Link
                  href="/checkout"
                  className="w-full py-4 bg-black text-white font-bold text-xs uppercase tracking-widest rounded-[8px] hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  PROCEED TO CHECKOUT
                  <span aria-hidden="true">&rarr;</span>
                </Link>

                <p className="text-[11px] text-center text-neutral-400 leading-tight">
                  Secure checkout &bull; 14-day domestic returns &bull; Guaranteed authentic
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
