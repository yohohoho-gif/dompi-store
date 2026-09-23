"use client";

import React, { useSyncExternalStore, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartItem } from "@/context/CartContext";

interface OrderReceipt {
  orderNumber: string;
  orderId?: string;
  subtotal: number;
  shippingFee?: number;
  shipping?: number;
  total: number;
  currency?: string;
  paymentMethod: "bank_transfer" | "promptpay" | string;
  items?: CartItem[];
  shippingAddress?: {
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
  createdAt?: string;
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
  const queryOrderNumber =
    searchParams.get("orderNumber") || searchParams.get("orderId");
  const rawStoredOrder = useSyncExternalStore(
    subscribe,
    getSessionSnapshot,
    getServerSnapshot
  );

  let receipt: OrderReceipt | null = null;
  if (rawStoredOrder) {
    try {
      receipt = JSON.parse(rawStoredOrder);
    } catch {
      receipt = null;
    }
  }

  const orderNumber = receipt?.orderNumber || queryOrderNumber || "DMP-ARCHIVE";
  const currency = receipt?.currency || "THB";
  const shippingFee = receipt?.shippingFee ?? receipt?.shipping ?? 0;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      {/* 1. Header Confirmation Card */}
      <div className="text-center space-y-4 pb-12 border-b border-neutral-200">
        <div className="w-14 h-14 mx-auto bg-black text-white rounded-full flex items-center justify-center">
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <span className="text-[11px] font-bold tracking-[0.25em] text-neutral-400 uppercase block">
          DISPATCH CONFIRMED
        </span>

        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-black">
          ORDER CONFIRMED
        </h1>

        <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto tracking-tight leading-relaxed">
          Thank you for choosing DOMPI. Your order has been securely reserved in our database queue and is awaiting fulfillment.
        </p>

        {/* Order Reference Pill */}
        <div className="inline-block bg-neutral-100 border border-neutral-200 rounded-[8px] px-5 py-2.5 text-xs font-bold text-black uppercase tracking-wider">
          ORDER NUMBER: <span className="font-black text-black ml-1">{orderNumber}</span>
        </div>
      </div>

      {/* 2. Order Summary Details */}
      <div className="py-10 space-y-10">
        {/* Authoritative Financial Breakdown & Payment Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment Instructions Card */}
          <div className="p-5 border border-neutral-200 rounded-[8px] bg-neutral-50 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-black pb-2 border-b border-neutral-200 flex items-center justify-between">
              <span>PAYMENT INSTRUCTIONS</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded-[4px]">
                PENDING SETTLEMENT
              </span>
            </h3>

            {receipt?.paymentMethod === "promptpay" ? (
              <div className="text-xs text-neutral-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Method:</span>
                  <strong className="text-black uppercase font-bold">PromptPay QR</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">PromptPay ID:</span>
                  <span className="font-mono font-bold text-black">081-234-5678</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Account Name:</span>
                  <span className="font-semibold text-black">DOMPI STORE ARCHIVE</span>
                </div>
                <p className="text-[11px] text-neutral-500 pt-2 border-t border-neutral-200 leading-relaxed">
                  Please scan and transfer exact amount via any Thai mobile banking app. Your order reference is{" "}
                  <strong className="text-black">{orderNumber}</strong>.
                </p>
              </div>
            ) : (
              <div className="text-xs text-neutral-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Method:</span>
                  <strong className="text-black uppercase font-bold">Direct Bank Transfer</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Bank:</span>
                  <span className="font-semibold text-black">Kasikornbank (KBank)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Account No:</span>
                  <span className="font-mono font-bold text-black">045-8-12345-6</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Account Name:</span>
                  <span className="font-semibold text-black">DOMPI CO., LTD.</span>
                </div>
                <p className="text-[11px] text-neutral-500 pt-2 border-t border-neutral-200 leading-relaxed">
                  Please complete transfer within 24 hours and include{" "}
                  <strong className="text-black">{orderNumber}</strong> in your payment slip memo.
                </p>
              </div>
            )}
          </div>

          {/* Authoritative Totals Card (Direct from RPC) */}
          <div className="p-5 border border-neutral-200 rounded-[8px] bg-neutral-50 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-black pb-2 border-b border-neutral-200 flex items-center justify-between">
              <span>AUTHORITATIVE TOTALS</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-[4px]">
                RPC CONFIRMED
              </span>
            </h3>

            <div className="text-xs text-neutral-600 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold text-black">
                  {currency} {(receipt?.subtotal ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee:</span>
                <span className="font-bold text-black">
                  {shippingFee === 0 ? "FREE" : `${currency} ${shippingFee.toLocaleString()}`}
                </span>
              </div>
              <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline">
                <span className="text-xs font-black uppercase tracking-wider text-black">
                  TOTAL AMOUNT:
                </span>
                <span className="text-xl font-black tracking-tight text-black">
                  {currency} {(receipt?.total ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address Summary */}
        {receipt?.shippingAddress && (
          <div className="p-5 border border-neutral-200 rounded-[8px] bg-white space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-black pb-2 border-b border-neutral-200">
              SHIPPING DESTINATION
            </h3>
            <div className="text-xs text-neutral-600 space-y-1">
              <p className="font-bold text-black">
                {receipt.shippingAddress.firstName} {receipt.shippingAddress.lastName}
              </p>
              <p>{receipt.shippingAddress.phone}</p>
              <p>{receipt.shippingAddress.email}</p>
              <p className="pt-1">
                {receipt.shippingAddress.address}, {receipt.shippingAddress.subdistrict},{" "}
                {receipt.shippingAddress.district}, {receipt.shippingAddress.province}{" "}
                {receipt.shippingAddress.postalCode}, Thailand
              </p>
            </div>
          </div>
        )}

        {/* Purchased Pieces Summary */}
        {receipt?.items && receipt.items.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-black mb-4">
              RESERVED PIECES ({receipt.items.length})
            </h2>

            <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-[8px] bg-white overflow-hidden">
              {receipt.items.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <div className="relative w-14 h-18 shrink-0 bg-neutral-100 rounded-[6px] overflow-hidden border border-neutral-200">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      sizes="56px"
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
                      COLOR: <strong>{item.color}</strong> &bull; SIZE:{" "}
                      <strong>{item.size}</strong> &bull; QTY: <strong>{item.quantity}</strong>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black tracking-tight text-black">
                      {currency} {(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
