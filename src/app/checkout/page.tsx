"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart, CartItem } from "@/context/CartContext";

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

type PaymentMethod = "cod" | "transfer" | "card";

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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingFormData, string>>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInputChange = (field: keyof ShippingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingFormData, string>> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9+() -]{9,15}$/.test(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number (e.g. 0812345678)";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.address.trim()) newErrors.address = "Street address is required";
    if (!formData.subdistrict.trim()) newErrors.subdistrict = "Subdistrict is required";
    if (!formData.district.trim()) newErrors.district = "District is required";
    if (!formData.province.trim()) newErrors.province = "Province is required";

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "Postal code is required";
    } else if (!/^\d{5}$/.test(formData.postalCode.trim())) {
      newErrors.postalCode = "Please enter a valid 5-digit postal code";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) return;

    if (!validateForm()) {
      const firstErrorKey = Object.keys(errors)[0];
      const el = document.getElementById(firstErrorKey);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsProcessing(true);

    // Generate mock order number
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const mockOrderNumber = `DMP-${randomDigits}`;

    const orderReceipt = {
      orderNumber: mockOrderNumber,
      date: new Date().toISOString(),
      items: [...items],
      shippingAddress: { ...formData },
      paymentMethod,
      subtotal,
      shipping,
      total,
    };

    // Store in sessionStorage for /order-success page
    try {
      sessionStorage.setItem("dompi_last_order", JSON.stringify(orderReceipt));
    } catch (err) {
      console.error("Failed to store order in sessionStorage", err);
    }

    // Simulate order placement delay, clear cart and redirect
    setTimeout(() => {
      clearCart();
      router.push(`/order-success?orderId=${mockOrderNumber}`);
    }, 1200);
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
          <span className="text-[11px] font-bold tracking-[0.25em] text-neutral-400 uppercase block mb-1">
            FINAL DISPATCH
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-black uppercase">
            CHECKOUT
          </h1>
        </header>

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
              {/* Left Column (7 cols): Shipping Form & Payment */}
              <div className="lg:col-span-7 space-y-10">
                {/* 1. Contact & Shipping Information */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                    <h2 className="text-sm font-black uppercase tracking-wider text-black">
                      1. SHIPPING DESTINATION
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
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          placeholder="e.g. Alex"
                          className={`w-full bg-white border rounded-[8px] px-3.5 py-3 text-xs text-black placeholder-neutral-400 focus:outline-none ${
                            errors.firstName ? "border-red-600 ring-1 ring-red-600" : "border-neutral-300 focus:border-black"
                          }`}
                        />
                        {errors.firstName && (
                          <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.firstName}</p>
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
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          placeholder="e.g. Chen"
                          className={`w-full bg-white border rounded-[8px] px-3.5 py-3 text-xs text-black placeholder-neutral-400 focus:outline-none ${
                            errors.lastName ? "border-red-600 ring-1 ring-red-600" : "border-neutral-300 focus:border-black"
                          }`}
                        />
                        {errors.lastName && (
                          <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.lastName}</p>
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
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          placeholder="e.g. 0812345678"
                          className={`w-full bg-white border rounded-[8px] px-3.5 py-3 text-xs text-black placeholder-neutral-400 focus:outline-none ${
                            errors.phone ? "border-red-600 ring-1 ring-red-600" : "border-neutral-300 focus:border-black"
                          }`}
                        />
                        {errors.phone && (
                          <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.phone}</p>
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
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="e.g. alex@example.com"
                          className={`w-full bg-white border rounded-[8px] px-3.5 py-3 text-xs text-black placeholder-neutral-400 focus:outline-none ${
                            errors.email ? "border-red-600 ring-1 ring-red-600" : "border-neutral-300 focus:border-black"
                          }`}
                        />
                        {errors.email && (
                          <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.email}</p>
                        )}
                      </div>
                    </div>

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
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        placeholder="House no., street, soi, building..."
                        className={`w-full bg-white border rounded-[8px] px-3.5 py-3 text-xs text-black placeholder-neutral-400 focus:outline-none ${
                          errors.address ? "border-red-600 ring-1 ring-red-600" : "border-neutral-300 focus:border-black"
                        }`}
                      />
                      {errors.address && (
                        <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.address}</p>
                      )}
                    </div>

                    {/* Geographic Fields: Subdistrict, District */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="subdistrict"
                          className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5"
                        >
                          Subdistrict (Tambon/Khwaeng)
                        </label>
                        <input
                          id="subdistrict"
                          type="text"
                          value={formData.subdistrict}
                          onChange={(e) => handleInputChange("subdistrict", e.target.value)}
                          placeholder="e.g. Khlong Tan Nuea"
                          className={`w-full bg-white border rounded-[8px] px-3.5 py-3 text-xs text-black placeholder-neutral-400 focus:outline-none ${
                            errors.subdistrict ? "border-red-600 ring-1 ring-red-600" : "border-neutral-300 focus:border-black"
                          }`}
                        />
                        {errors.subdistrict && (
                          <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.subdistrict}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="district"
                          className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5"
                        >
                          District (Amphoe/Khet)
                        </label>
                        <input
                          id="district"
                          type="text"
                          value={formData.district}
                          onChange={(e) => handleInputChange("district", e.target.value)}
                          placeholder="e.g. Watthana"
                          className={`w-full bg-white border rounded-[8px] px-3.5 py-3 text-xs text-black placeholder-neutral-400 focus:outline-none ${
                            errors.district ? "border-red-600 ring-1 ring-red-600" : "border-neutral-300 focus:border-black"
                          }`}
                        />
                        {errors.district && (
                          <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.district}</p>
                        )}
                      </div>
                    </div>

                    {/* Province & Postal Code */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="province"
                          className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5"
                        >
                          Province
                        </label>
                        <input
                          id="province"
                          type="text"
                          value={formData.province}
                          onChange={(e) => handleInputChange("province", e.target.value)}
                          placeholder="e.g. Bangkok"
                          className={`w-full bg-white border rounded-[8px] px-3.5 py-3 text-xs text-black placeholder-neutral-400 focus:outline-none ${
                            errors.province ? "border-red-600 ring-1 ring-red-600" : "border-neutral-300 focus:border-black"
                          }`}
                        />
                        {errors.province && (
                          <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.province}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="postalCode"
                          className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5"
                        >
                          Postal Code
                        </label>
                        <input
                          id="postalCode"
                          type="text"
                          value={formData.postalCode}
                          onChange={(e) => handleInputChange("postalCode", e.target.value)}
                          placeholder="e.g. 10110"
                          maxLength={5}
                          className={`w-full bg-white border rounded-[8px] px-3.5 py-3 text-xs text-black placeholder-neutral-400 focus:outline-none ${
                            errors.postalCode ? "border-red-600 ring-1 ring-red-600" : "border-neutral-300 focus:border-black"
                          }`}
                        />
                        {errors.postalCode && (
                          <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.postalCode}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Payment Method Selector (Prototype) */}
                <section className="space-y-6 pt-4 border-t border-neutral-200">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                    <h2 className="text-sm font-black uppercase tracking-wider text-black">
                      2. PAYMENT METHOD (PROTOTYPE)
                    </h2>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-[4px]">
                      Simulated Checkout
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-[8px] text-[11px] text-neutral-500 leading-relaxed">
                    <strong>Notice:</strong> This is a design prototype. No credit card or actual money will be charged.
                  </div>

                  <div className="space-y-3">
                    {/* COD Option */}
                    <label
                      className={`flex items-start gap-3.5 p-4 rounded-[8px] border cursor-pointer transition-all ${
                        paymentMethod === "cod"
                          ? "border-black bg-neutral-50 ring-1 ring-black"
                          : "border-neutral-200 hover:border-neutral-400 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                        className="mt-1 text-black focus:ring-black"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-black block">
                          Cash on Delivery (COD)
                        </span>
                        <p className="text-[11px] text-neutral-500 leading-tight">
                          Pay in cash upon physical garment delivery at your doorstep.
                        </p>
                      </div>
                    </label>

                    {/* Bank Transfer Option */}
                    <label
                      className={`flex items-start gap-3.5 p-4 rounded-[8px] border cursor-pointer transition-all ${
                        paymentMethod === "transfer"
                          ? "border-black bg-neutral-50 ring-1 ring-black"
                          : "border-neutral-200 hover:border-neutral-400 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="transfer"
                        checked={paymentMethod === "transfer"}
                        onChange={() => setPaymentMethod("transfer")}
                        className="mt-1 text-black focus:ring-black"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-black block">
                          Direct Bank Transfer / PromptPay QR
                        </span>
                        <p className="text-[11px] text-neutral-500 leading-tight">
                          Transfer details and QR code will be provided on the order confirmation screen.
                        </p>
                      </div>
                    </label>

                    {/* Card Option (Preview) */}
                    <label
                      className={`flex items-start gap-3.5 p-4 rounded-[8px] border cursor-pointer transition-all ${
                        paymentMethod === "card"
                          ? "border-black bg-neutral-50 ring-1 ring-black"
                          : "border-neutral-200 hover:border-neutral-400 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={paymentMethod === "card"}
                        onChange={() => setPaymentMethod("card")}
                        className="mt-1 text-black focus:ring-black"
                      />
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-black">
                            Credit / Debit Card (Preview)
                          </span>
                          <span className="text-[10px] text-neutral-400 font-bold uppercase">
                            Visa &bull; MC &bull; JCB
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 leading-tight">
                          Encrypted prototype payment gateway with zero physical transaction.
                        </p>
                        {paymentMethod === "card" && (
                          <div className="pt-3 space-y-2.5">
                            <input
                              type="text"
                              placeholder="Card number (Mock)"
                              defaultValue="4000 1234 5678 9010"
                              disabled
                              className="w-full bg-white border border-neutral-300 rounded-[8px] px-3 py-2 text-xs text-neutral-600"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="MM/YY"
                                defaultValue="12/28"
                                disabled
                                className="w-full bg-white border border-neutral-300 rounded-[8px] px-3 py-2 text-xs text-neutral-600"
                              />
                              <input
                                type="text"
                                placeholder="CVV"
                                defaultValue="888"
                                disabled
                                className="w-full bg-white border border-neutral-300 rounded-[8px] px-3 py-2 text-xs text-neutral-600"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </section>
              </div>

              {/* Right Column (5 cols sticky): Order Summary */}
              <div className="lg:col-span-5 bg-neutral-50 border border-neutral-200 rounded-[8px] p-6 sm:p-8 lg:sticky lg:top-24 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                  <h2 className="text-sm font-black uppercase tracking-tight text-black">
                    ORDER SUMMARY
                  </h2>
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    {items.length} {items.length === 1 ? "Item" : "Items"}
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

                {/* Financial Breakdown */}
                <div className="space-y-3 text-xs tracking-tight border-t border-neutral-200 pt-4">
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

                  <div className="border-t border-neutral-200 pt-3 flex justify-between items-baseline">
                    <span className="text-xs font-black uppercase tracking-wider text-black">
                      TOTAL AMOUNT
                    </span>
                    <span className="text-2xl font-black tracking-tight text-black">
                      THB {total.toLocaleString()}
                    </span>
                  </div>
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
                    By placing your order, you agree to DOMPI terms of service and store archival policies.
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
