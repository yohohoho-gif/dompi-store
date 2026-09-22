"use client";

import { useSyncExternalStore, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartItem } from "@/context/CartContext";

interface OrderReceipt {
  orderNumber: string;
  date: string;
  items: CartItem[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
    subdistrict: string;
    district: string;
    province: string;
    postalCode: string;
  };
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  total: number;
}

function getSessionSnapshot(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem("dompi_last_order") || "";
  } catch {
    return "";
  }
}

function getServerSnapshot(): string {
  return "";
}

function subscribe() {
  return () => {};
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const queryOrderId = searchParams.get("orderId");
  const rawStoredOrder = useSyncExternalStore(subscribe, getSessionSnapshot, getServerSnapshot);

  let receipt: OrderReceipt | null = null;
  if (rawStoredOrder) {
    try {
      receipt = JSON.parse(rawStoredOrder);
    } catch {
      receipt = null;
    }
  }

  const orderNumber = receipt?.orderNumber || queryOrderId || "DMP-849102";

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      {/* 1. Header Confirmation Card */}
      <div className="text-center space-y-4 pb-12 border-b border-neutral-200">
        <div className="w-14 h-14 mx-auto bg-black text-white rounded-full flex items-center justify-center">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <span className="text-[11px] font-bold tracking-[0.25em] text-neutral-400 uppercase block">
          DISPATCH CONFIRMED
        </span>

        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-black">
          ORDER CONFIRMED
        </h1>

        <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto tracking-tight">
          Thank you for choosing DOMPI. Your streetwear order has been logged into our studio queue and is being prepared for express delivery.
        </p>

        {/* Order Reference Pill */}
        <div className="inline-block bg-neutral-100 border border-neutral-200 rounded-[8px] px-5 py-2 text-xs font-bold text-black uppercase tracking-wider">
          ORDER NUMBER: <span className="font-black text-black">{orderNumber}</span>
        </div>
      </div>

      {/* 2. Order Summary Details */}
      <div className="py-10 space-y-10">
        {/* Purchased Items List */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-black mb-4">
            PURCHASED PIECES ({receipt?.items?.length || 0})
          </h2>

          {receipt?.items && receipt.items.length > 0 ? (
            <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-[8px] bg-white overflow-hidden">
              {receipt.items.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <div className="relative w-16 h-20 shrink-0 bg-neutral-100 rounded-[6px] overflow-hidden border border-neutral-200">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      sizes="64px"
                      className="object-cover grayscale contrast-105"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase block">
                      {item.product.category}
                    </span>
                    <h3 className="text-xs font-bold text-black uppercase truncate">
                      {item.product.name}
                    </h3>
                    <div className="text-[11px] text-neutral-500 font-medium">
                      COLOR: <strong>{item.color}</strong> &bull; SIZE: <strong>{item.size}</strong> &bull; QTY: <strong>{item.quantity}</strong>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black tracking-tight text-black">
                      THB {(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 border border-neutral-200 rounded-[8px] text-xs text-neutral-500">
              Order reference #{orderNumber} logged successfully.
            </div>
          )}
        </div>

        {/* Shipping & Payment Meta Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipping Address Summary */}
          <div className="p-5 border border-neutral-200 rounded-[8px] bg-neutral-50 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-black pb-2 border-b border-neutral-200">
              SHIPPING RECIPIENT
            </h3>
            {receipt?.shippingAddress ? (
              <div className="text-xs text-neutral-600 space-y-1">
                <p className="font-bold text-black">
                  {receipt.shippingAddress.firstName} {receipt.shippingAddress.lastName}
                </p>
                <p>{receipt.shippingAddress.phone}</p>
                <p>{receipt.shippingAddress.email}</p>
                <p className="pt-1">
                  {receipt.shippingAddress.address}, {receipt.shippingAddress.subdistrict}, {receipt.shippingAddress.district}, {receipt.shippingAddress.province} {receipt.shippingAddress.postalCode}
                </p>
              </div>
            ) : (
              <p className="text-xs text-neutral-500">Express delivery to your registered address.</p>
            )}
          </div>

          {/* Payment Method & Total */}
          <div className="p-5 border border-neutral-200 rounded-[8px] bg-neutral-50 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-black pb-2 border-b border-neutral-200">
              PAYMENT & SUMMARY
            </h3>
            <div className="text-xs text-neutral-600 space-y-1.5">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <strong className="text-black uppercase font-bold">
                  {receipt?.paymentMethod === "cod"
                    ? "Cash on Delivery"
                    : receipt?.paymentMethod === "transfer"
                    ? "Direct Bank Transfer"
                    : "Credit Card (Mock)"}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold text-black">
                  THB {receipt?.subtotal?.toLocaleString() ?? "0"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="font-bold text-black">
                  {receipt?.shipping === 0 ? "FREE" : `THB ${receipt?.shipping ?? 100}`}
                </span>
              </div>
              <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline">
                <span className="text-xs font-black uppercase tracking-wider text-black">
                  TOTAL PAID:
                </span>
                <span className="text-xl font-black tracking-tight text-black">
                  THB {receipt?.total?.toLocaleString() ?? "0"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/shop"
          className="w-full sm:w-auto px-8 py-3.5 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-[8px] hover:bg-neutral-800 transition-colors text-center"
        >
          CONTINUE SHOPPING
        </Link>
        <Link
          href="/"
          className="w-full sm:w-auto px-8 py-3.5 bg-white text-black border border-neutral-300 text-xs font-bold uppercase tracking-widest rounded-[8px] hover:border-black transition-colors text-center"
        >
          BACK TO HOME
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col antialiased selection:bg-black selection:text-white">
      <Navbar />

      <main className="flex-1 w-full">
        <Suspense
          fallback={
            <div className="py-24 text-center">
              <div className="animate-pulse space-y-4 max-w-sm mx-auto">
                <div className="h-6 bg-neutral-200 rounded-[8px]" />
                <div className="h-4 bg-neutral-100 rounded-[8px]" />
              </div>
            </div>
          }
        >
          <OrderSuccessContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
