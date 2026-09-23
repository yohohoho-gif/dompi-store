"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart, CartItem } from "@/context/CartContext";
import ThailandAddressSelector from "@/components/common/ThailandAddressSelector";
import {
  placeOrderAction,
  PlaceOrderInput,
  CheckoutPaymentMethod,
} from "@/app/actions/checkout";
import { createClient } from "@/lib/supabase/client";

interface ShippingFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  province: string;
  district: string;
  subdistrict: string;
  postalCode: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, shipping, total, clearCart, isHydrated } = useCart();

  const [formData, setFormData] = useState<ShippingFormData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    province: "",
    district: "",
    subdistrict: "",
    postalCode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("bank_transfer");
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingFormData, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  // Preserve ONE idempotency UUID per checkout session without regenerating on re-render
  const idempotencyKeyRef = useRef<string>("");

  useEffect(() => {
    if (!idempotencyKeyRef.current) {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        idempotencyKeyRef.current = crypto.randomUUID();
      } else {
        // Fallback standard UUID v4
        idempotencyKeyRef.current = "10000000-1000-4000-8000-100000000000".replace(
          /[018]/g,
          (c) =>
            (
              +c ^
              (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
            ).toString(16)
        );
      }
    }
  }, []);

  // Autofill if authenticated customer exists
  useEffect(() => {
    let ignore = false;
    async function loadCustomerDefaults() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && !ignore) {
          setAuthEmail(user.email ?? null);
          setFormData((prev) => ({
            ...prev,
            email: prev.email || user.email || "",
          }));

          // Fetch profile and default address for convenient customer autofill
          const { data: profile } = await supabase
            .from("customer_profiles")
            .select("full_name, phone")
            .eq("id", user.id)
            .maybeSingle();

          if (profile && !ignore) {
            const parts = (profile.full_name || "").trim().split(/\s+/);
            const firstName = parts[0] || "";
            const lastName = parts.slice(1).join(" ") || "";

            setFormData((prev) => ({
              ...prev,
              firstName: prev.firstName || firstName,
              lastName: prev.lastName || lastName,
              phone: prev.phone || profile.phone || "",
            }));
          }

          const { data: defaultAddr } = await supabase
            .from("customer_addresses")
            .select("recipient_name, phone, address_line, subdistrict, district, province, postal_code")
            .eq("user_id", user.id)
            .order("is_default", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (defaultAddr && !ignore) {
            const addrParts = (defaultAddr.recipient_name || "").trim().split(/\s+/);
            setFormData((prev) => ({
              ...prev,
              firstName: prev.firstName || addrParts[0] || "",
              lastName: prev.lastName || addrParts.slice(1).join(" ") || "",
              phone: prev.phone || defaultAddr.phone || "",
              address: prev.address || defaultAddr.address_line || "",
              subdistrict: prev.subdistrict || defaultAddr.subdistrict || "",
              district: prev.district || defaultAddr.district || "",
              province: prev.province || defaultAddr.province || "",
              postalCode: prev.postalCode || defaultAddr.postal_code || "",
            }));
          }
        }
      } catch (err) {
        console.error("Autofill check error:", err);
      }
    }

    loadCustomerDefaults();
    return () => {
      ignore = true;
    };
  }, []);

  const handleInputChange = (field: keyof ShippingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingFormData, string>> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    const trimmedPhone = formData.phone.trim();
    if (!trimmedPhone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9+() -]{9,20}$/.test(trimmedPhone)) {
      newErrors.phone = "Please enter a valid phone number (e.g. 0812345678)";
    }

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = "Please enter a valid email address";
    }

    const trimmedAddress = formData.address.trim();
    if (!trimmedAddress) {
      newErrors.address = "Street address is required";
    } else if (trimmedAddress.length < 5) {
      newErrors.address = "Street address must be at least 5 characters";
    }

    if (!formData.province.trim()) {
      newErrors.province = "Province is required";
    }

    if (!formData.district.trim()) {
      newErrors.district = "District is required";
    }

    if (!formData.subdistrict.trim()) {
      newErrors.subdistrict = "Subdistrict is required";
    }

    const trimmedPostal = formData.postalCode.trim();
    if (!trimmedPostal) {
      newErrors.postalCode = "Postal code is required";
    } else if (!/^\d{5}$/.test(trimmedPostal)) {
      newErrors.postalCode = "Please enter a valid 5-digit postal code";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent accidental double-submit while request is pending
    if (isProcessing) return;

    if (items.length === 0) return;

    if (!validateForm()) {
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        const el = document.getElementById(firstErrorKey);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsProcessing(true);
    setServerError(null);

    // Ensure idempotency key exists
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
              (
                +c ^
                (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
              ).toString(16)
            );
    }

    const recipientFullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

    const orderPayload: PlaceOrderInput = {
      items: items.map((item) => ({
        variantId: item.variantId,
        productId: item.product.id,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
      })),
      contact: {
        name: recipientFullName,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      },
      shippingAddress: {
        recipientName: recipientFullName,
        phone: formData.phone.trim(),
        addressLine: formData.address.trim(),
        subdistrict: formData.subdistrict.trim(),
        district: formData.district.trim(),
        province: formData.province.trim(),
        postalCode: formData.postalCode.trim(),
        country: "TH",
      },
      paymentMethod,
      idempotencyKey: idempotencyKeyRef.current,
    };

    try {
      const result = await placeOrderAction(orderPayload);

      if (!result.success || !result.data) {
        // Handle failure: preserve cart, show friendly user error
        setServerError(
          result.error ||
            "Unable to place your order at this time. Please check your details and try again."
        );
        setIsProcessing(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // Successful order creation: store authoritative receipt info
      const receipt = {
        orderNumber: result.data.order_number,
        orderId: result.data.order_id,
        subtotal: result.data.subtotal,
        shippingFee: result.data.shipping_fee,
        total: result.data.total,
        currency: result.data.currency,
        paymentMethod,
        items: [...items],
        shippingAddress: { ...formData },
        createdAt: new Date().toISOString(),
      };

      try {
        sessionStorage.setItem("dompi_last_order", JSON.stringify(receipt));
      } catch (err) {
        console.error("Failed to store receipt in sessionStorage", err);
      }

      // Clear the cart ONLY after successful order creation
      clearCart();

      // Navigate to /order-success with authoritative order number
      router.push(`/order-success?orderNumber=${encodeURIComponent(result.data.order_number)}`);
    } catch (err) {
      console.error("Checkout execution error:", err);
      setServerError("A network error occurred while submitting your order. Please try again.");
      setIsProcessing(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="animate-pulse space-y-4 max-w-sm mx-auto">
            <div className="h-6 bg-neutral-200 rounded-[8px]" />
            <div className="h-4 bg-neutral-100 rounded-[8px]" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col antialiased selection:bg-black selection:text-white">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Navigation Breadcrumb */}
        <nav className="mb-6 text-xs font-medium text-neutral-400">
          <Link
            href="/cart"
            className="hover:text-black uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
          >
            &larr; Return to Bag
          </Link>
        </nav>

        {/* Page Header */}
        <header className="mb-10 pb-6 border-b border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold tracking-[0.25em] text-neutral-400 uppercase block mb-1">
                SECURE DISPATCH
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-black uppercase">
                CHECKOUT
              </h1>
            </div>
            {authEmail && (
              <span className="text-xs text-neutral-500 font-medium">
                Ordering as <strong className="text-black">{authEmail}</strong>
              </span>
            )}
          </div>
        </header>

        {/* Global Error Banner */}
        {serverError && (
          <div
            role="alert"
            className="mb-8 p-4 bg-red-50 border border-red-200 rounded-[8px] flex items-start gap-3 text-red-900"
          >
            <svg
              className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1 text-xs">
              <strong className="font-bold block uppercase tracking-wide mb-0.5">
                Order Placement Notice
              </strong>
              <p className="leading-relaxed">{serverError}</p>
            </div>
            <button
              type="button"
              onClick={() => setServerError(null)}
              className="text-red-500 hover:text-red-800 text-xs font-bold uppercase tracking-wider ml-auto"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Cart Protection: Empty State */}
        {items.length === 0 && !isProcessing ? (
          <div className="py-20 text-center border border-dashed border-neutral-200 rounded-[8px] my-6">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-black mb-2">
              YOUR CART IS CURRENTLY EMPTY
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto mb-6">
              You cannot place an order with an empty bag. Please select garments from our catalog.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-[8px] hover:bg-neutral-800 transition-colors"
            >
              EXPLORE SHOP
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} noValidate>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              {/* Left Column (7 cols): Contact, Shipping & Payment */}
              <div className="lg:col-span-7 space-y-10">
                {/* 1. Contact Details */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                    <h2 className="text-sm font-black uppercase tracking-wider text-black">
                      1. CONTACT & RECIPIENT
                    </h2>
                    <span className="text-[11px] text-neutral-400 font-medium">
                      * All fields required
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="firstName"
                          className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5"
                        >
                          First Name
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          disabled={isProcessing}
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          placeholder="e.g. Alex"
                          className={`w-full bg-white border rounded-[8px] px-3.5 py-3 text-xs text-black placeholder-neutral-400 focus:outline-none disabled:bg-neutral-100 ${
                            errors.firstName
                              ? "border-red-600 ring-1 ring-red-600"
                              : "border-neutral-300 focus:border-black"
                          }`}
                        />
                        {errors.firstName && (
                          <p className="mt-1 text-[11px] text-red-600 font-medium">
                            {errors.firstName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="lastName"
                          className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5"
                        >
                          Last Name
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          disabled={isProcessing}
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          placeholder="e.g. Chen"
                          className={`w-full bg-white border rounded-[8px] px-3.5 py-3 text-xs text-black placeholder-neutral-400 focus:outline-none disabled:bg-neutral-100 ${
                            errors.lastName
                              ? "border-red-600 ring-1 ring-red-600"
                              : "border-neutral-300 focus:border-black"
                          }`}
                        />
                        {errors.lastName && (
                          <p className="mt-1 text-[11px] text-red-600 font-medium">
                            {errors.lastName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contact Fields: Phone & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5"
                        >
                          Phone Number
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          disabled={isProcessing}
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          placeholder="e.g. 0812345678"
                          className={`w-full bg-white border rounded-[8px] px-3.5 py-3 text-xs text-black placeholder-neutral-400 focus:outline-none disabled:bg-neutral-100 ${
                            errors.phone
                              ? "border-red-600 ring-1 ring-red-600"
                              : "border-neutral-300 focus:border-black"
                          }`}
                        />
                        {errors.phone && (
                          <p className="mt-1 text-[11px] text-red-600 font-medium">
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5"
                        >
                          Email Address
                        </label>
                        <input
                          id="email"
                          type="email"
                          disabled={isProcessing}
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="e.g. alex@example.com"
                          className={`w-full bg-white border rounded-[8px] px-3.5 py-3 text-xs text-black placeholder-neutral-400 focus:outline-none disabled:bg-neutral-100 ${
                            errors.email
                              ? "border-red-600 ring-1 ring-red-600"
                              : "border-neutral-300 focus:border-black"
                          }`}
                        />
                        {errors.email && (
                          <p className="mt-1 text-[11px] text-red-600 font-medium">
                            {errors.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Thailand Shipping Destination */}
                <section className="space-y-6 pt-4 border-t border-neutral-200">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                    <h2 className="text-sm font-black uppercase tracking-wider text-black">
                      2. THAILAND SHIPPING DESTINATION
                    </h2>
                    <span className="text-[11px] text-neutral-400 font-medium">
                      Country: Thailand (TH)
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Street Address */}
                    <div>
                      <label
                        htmlFor="address"
                        className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5"
                      >
                        Street Address / Building
                      </label>
                      <input
                        id="address"
                        type="text"
                        disabled={isProcessing}
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        placeholder="House no., street, soi, building..."
                        className={`w-full bg-white border rounded-[8px] px-3.5 py-3 text-xs text-black placeholder-neutral-400 focus:outline-none disabled:bg-neutral-100 ${
                          errors.address
                            ? "border-red-600 ring-1 ring-red-600"
                            : "border-neutral-300 focus:border-black"
                        }`}
                      />
                      {errors.address && (
                        <p className="mt-1 text-[11px] text-red-600 font-medium">
                          {errors.address}
                        </p>
                      )}
                    </div>

                    {/* Integrated ThailandAddressSelector (Province, District, Subdistrict, Postal Code) */}
                    <div>
                      <ThailandAddressSelector
                        value={{
                          province: formData.province,
                          district: formData.district,
                          subdistrict: formData.subdistrict,
                          postalCode: formData.postalCode,
                        }}
                        onChange={(nextAddr) => {
                          setFormData((prev) => ({
                            ...prev,
                            province: nextAddr.province,
                            district: nextAddr.district,
                            subdistrict: nextAddr.subdistrict,
                            postalCode: nextAddr.postalCode,
                          }));
                          setErrors((prev) => ({
                            ...prev,
                            province: undefined,
                            district: undefined,
                            subdistrict: undefined,
                            postalCode: undefined,
                          }));
                          if (serverError) setServerError(null);
                        }}
                        disabled={isProcessing}
                        errors={{
                          province: errors.province,
                          district: errors.district,
                          subdistrict: errors.subdistrict,
                          postalCode: errors.postalCode,
                        }}
                      />
                    </div>
                  </div>
                </section>

                {/* 3. Payment Method Selector */}
                <section className="space-y-6 pt-4 border-t border-neutral-200">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                    <h2 className="text-sm font-black uppercase tracking-wider text-black">
                      3. PAYMENT METHOD
                    </h2>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-[4px] border border-emerald-200">
                      SECURE RPC
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Bank Transfer Option */}
                    <label
                      className={`flex items-start gap-3.5 p-4 rounded-[8px] border cursor-pointer transition-all ${
                        paymentMethod === "bank_transfer"
                          ? "border-black bg-neutral-50 ring-1 ring-black"
                          : "border-neutral-200 hover:border-neutral-400 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="bank_transfer"
                        disabled={isProcessing}
                        checked={paymentMethod === "bank_transfer"}
                        onChange={() => setPaymentMethod("bank_transfer")}
                        className="mt-1 text-black focus:ring-black"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-black block">
                          Direct Bank Transfer (Kasikornbank)
                        </span>
                        <p className="text-[11px] text-neutral-500 leading-tight">
                          Transfer directly to DOMPI official bank account. Account details will be presented upon dispatch confirmation.
                        </p>
                      </div>
                    </label>

                    {/* PromptPay Option */}
                    <label
                      className={`flex items-start gap-3.5 p-4 rounded-[8px] border cursor-pointer transition-all ${
                        paymentMethod === "promptpay"
                          ? "border-black bg-neutral-50 ring-1 ring-black"
                          : "border-neutral-200 hover:border-neutral-400 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="promptpay"
                        disabled={isProcessing}
                        checked={paymentMethod === "promptpay"}
                        onChange={() => setPaymentMethod("promptpay")}
                        className="mt-1 text-black focus:ring-black"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-black block">
                          PromptPay QR
                        </span>
                        <p className="text-[11px] text-neutral-500 leading-tight">
                          Instant mobile payment using any Thai banking application via PromptPay QR code.
                        </p>
                      </div>
                    </label>
                  </div>
                </section>
              </div>

              {/* Right Column (5 cols sticky): Order Summary */}
              <div className="lg:col-span-5 bg-neutral-50 border border-neutral-200 rounded-[8px] p-6 sm:p-8 lg:sticky lg:top-24 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                  <h2 className="text-sm font-black uppercase tracking-tight text-black">
                    BAG SUMMARY
                  </h2>
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    {items.length} {items.length === 1 ? "Piece" : "Pieces"}
                  </span>
                </div>

                {/* Products List */}
                <div className="divide-y divide-neutral-200 max-h-72 overflow-y-auto pr-1">
                  {items.map((item: CartItem) => {
                    const itemTotal = item.product.price * item.quantity;
                    return (
                      <div key={item.id} className="py-3 flex gap-3.5 items-center">
                        <div className="relative w-14 h-18 shrink-0 bg-neutral-200 rounded-[6px] overflow-hidden border border-neutral-200">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            sizes="56px"
                            className="object-cover grayscale contrast-105"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-bold tracking-tight text-black uppercase truncate">
                            {item.product.name}
                          </h3>
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wide">
                            {item.color} &bull; {item.size} &bull; Qty: {item.quantity}
                          </div>
                          <div className="text-[11px] font-semibold text-neutral-700">
                            THB {item.product.price.toLocaleString()} each
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black tracking-tight text-black">
                            THB {itemTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Financial Breakdown (Estimated UI before secure placement) */}
                <div className="space-y-3 text-xs tracking-tight border-t border-neutral-200 pt-4">
                  <div className="flex justify-between text-neutral-600">
                    <span>Estimated Subtotal</span>
                    <span className="font-bold text-black">
                      THB {subtotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-neutral-600">
                    <span>Estimated Shipping</span>
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

                  <div className="border-t border-neutral-200 pt-3 flex justify-between items-baseline">
                    <span className="text-xs font-black uppercase tracking-wider text-black">
                      ESTIMATED TOTAL
                    </span>
                    <span className="text-2xl font-black tracking-tight text-black">
                      THB {total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-neutral-200 rounded-[6px] text-[11px] text-neutral-500 leading-normal">
                  <strong className="text-black font-semibold">Authoritative Guarantee:</strong>{" "}
                  Final pricing and inventory reservation are confirmed authoritatively by the database transaction upon clicking Place Order.
                </div>

                {/* Submit Action */}
                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-4 bg-black text-white font-bold text-xs uppercase tracking-widest rounded-[8px] hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        PROCESSING ORDER...
                      </span>
                    ) : (
                      <>
                        PLACE ORDER
                        <span aria-hidden="true">&rarr;</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-neutral-400 leading-tight">
                    By confirming this order, inventory will be reserved and logged to the DOMPI archive queue.
                  </p>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
