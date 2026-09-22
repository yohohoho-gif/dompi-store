"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductWithVariants } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";

interface ProductDetailViewProps {
  product: ProductWithVariants;
  relatedProducts: ProductWithVariants[];
}

export default function ProductDetailView({
  product,
  relatedProducts,
}: ProductDetailViewProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(
    product.colors && product.colors.length > 0 ? product.colors[0].name : "Standard"
  );
  const [selectedSize, setSelectedSize] = useState(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : "M"
  );
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("description");

  // Dynamic stock derived from selected variant
  const activeVariant = product.variants?.find(
    (v) =>
      v.color.toLowerCase() === selectedColor.toLowerCase() &&
      v.size.toLowerCase() === selectedSize.toLowerCase()
  );
  const currentStock = activeVariant ? activeVariant.stock : (product.stock ?? 0);
  const isAvailable = currentStock > 0;

  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  const handleAddToCart = () => {
    addItem(product, selectedColor, selectedSize, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(product, selectedColor, selectedSize, quantity);
    router.push("/cart");
  };

  const toggleSection = (section: string) => {
    setOpenSection((current) => (current === section ? null : section));
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 1. Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-8 text-xs font-medium text-neutral-400">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="hover:text-black uppercase tracking-wider transition-colors">
              HOME
            </Link>
          </li>
          <li className="select-none text-neutral-300">/</li>
          <li>
            <Link href="/shop" className="hover:text-black uppercase tracking-wider transition-colors">
              SHOP
            </Link>
          </li>
          <li className="select-none text-neutral-300">/</li>
          <li className="text-black uppercase tracking-wider font-bold truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* 2. Product Image Gallery (Left Column - 7 Cols) */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails List */}
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:w-24 shrink-0 scrollbar-none pb-2 sm:pb-0">
              {images.map((img, idx) => {
                const isActive = selectedImageIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-24 sm:w-24 sm:h-28 rounded-[8px] overflow-hidden border transition-all shrink-0 bg-neutral-100 ${
                      isActive
                        ? "border-black ring-1 ring-black"
                        : "border-neutral-200 hover:border-neutral-400 opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`View image angle ${idx + 1}`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      fill
                      sizes="96px"
                      className="object-cover grayscale contrast-105"
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Large Main Product Image */}
          <div className="relative flex-1 aspect-[3/4] w-full bg-neutral-100 rounded-[8px] overflow-hidden border border-neutral-200">
            <Image
              src={images[selectedImageIndex] || product.image}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-center grayscale contrast-105"
            />

            {/* Tag Badge */}
            {product.tag && (
              <div className="absolute top-4 left-4 bg-black text-white text-[11px] font-bold tracking-widest px-3 py-1.5 uppercase rounded-[4px]">
                {product.tag}
              </div>
            )}
          </div>
        </div>

        {/* 3 & 4. Product Information & Options (Right Column - 5 Cols Sticky) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* Category & Title */}
          <div>
            <span className="text-[11px] font-bold tracking-[0.2em] text-neutral-400 uppercase block mb-1">
              {product.category}
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tighter text-black leading-tight">
              {product.name}
            </h1>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-black">
                {product.currency} {product.price.toLocaleString()}
              </span>
              <span className="text-[11px] text-neutral-400 tracking-tight">
                Tax included &bull; Free standard shipping
              </span>
            </div>
          </div>

          {/* Short Description */}
          <p className="text-xs sm:text-sm text-neutral-600 font-normal leading-relaxed tracking-tight">
            {product.description}
          </p>

          <div className="border-t border-neutral-200 pt-6 space-y-6">
            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-black">
                    COLOR: <span className="font-medium text-neutral-600">{selectedColor}</span>
                  </span>
                </div>
                <div className="flex gap-2.5">
                  {product.colors.map((c) => {
                    const isSelected = selectedColor === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedColor(c.name)}
                        className={`group relative flex items-center justify-center w-8 h-8 rounded-full border transition-all ${
                          isSelected
                            ? "border-black ring-2 ring-black ring-offset-2"
                            : "border-neutral-300 hover:border-black"
                        }`}
                        title={c.name}
                        aria-label={`Select color ${c.name}`}
                      >
                        <span
                          className="w-6 h-6 rounded-full border border-neutral-200"
                          style={{ backgroundColor: c.hex }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-black">
                    SIZE: <span className="font-medium text-neutral-600">{selectedSize}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenSection("size-guide")}
                    className="text-[11px] font-semibold text-neutral-500 uppercase hover:text-black underline underline-offset-2"
                  >
                    Size Guide
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {product.sizes.map((s) => {
                    const isSelected = selectedSize === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`py-3 text-xs font-bold uppercase tracking-wider rounded-[8px] transition-colors ${
                          isSelected
                            ? "bg-black text-white"
                            : "bg-white text-black border border-neutral-200 hover:border-black"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity & Stock Level */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-black">
                  QUANTITY
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  {isAvailable ? (
                    <span className="inline-flex items-center gap-1.5 text-neutral-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />
                      In Stock: {currentStock} units available
                    </span>
                  ) : (
                    <span className="text-neutral-400">Sold Out</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-neutral-200 rounded-[8px] bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || !isAvailable}
                    className="px-3.5 py-2.5 text-sm font-bold text-black hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-l-[8px]"
                    aria-label="Decrease quantity"
                  >
                    &minus;
                  </button>
                  <span className="w-10 text-center text-xs font-bold text-black">
                    {isAvailable ? quantity : 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                    disabled={quantity >= currentStock || !isAvailable}
                    className="px-3.5 py-2.5 text-sm font-bold text-black hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-r-[8px]"
                    aria-label="Increase quantity"
                  >
                    &#43;
                  </button>
                </div>
              </div>
            </div>

            {/* 5. Primary Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isAvailable}
                className={`w-full py-4 rounded-[8px] font-bold text-xs uppercase tracking-widest transition-all ${
                  !isAvailable
                    ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                    : addedToCart
                    ? "bg-neutral-800 text-white"
                    : "bg-black text-white hover:bg-neutral-800"
                }`}
              >
                {!isAvailable ? "OUT OF STOCK" : addedToCart ? "ADDED TO CART \u2713" : "ADD TO CART"}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!isAvailable}
                className="w-full py-4 rounded-[8px] font-bold text-xs uppercase tracking-widest bg-white text-black border border-black hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
              >
                BUY NOW
              </button>
            </div>
          </div>

          {/* 6. Collapsible Information Sections */}
          <div className="border-t border-neutral-200 pt-4 space-y-1">
            {/* Description Accordion */}
            <div className="border-b border-neutral-200 pb-3">
              <button
                type="button"
                onClick={() => toggleSection("description")}
                className="w-full py-2 flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-black"
              >
                <span>DESCRIPTION</span>
                <span>{openSection === "description" ? "−" : "+"}</span>
              </button>
              {openSection === "description" && (
                <div className="pt-2 pb-1 text-xs text-neutral-600 leading-relaxed tracking-tight">
                  <p>{product.description}</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-neutral-500">
                    <li>Architectural relaxed drape</li>
                    <li>Reinforced stress seams with raw edge aesthetic</li>
                    <li>Designed in Bangkok studio, engineered for global street rotation</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Materials Accordion */}
            <div className="border-b border-neutral-200 pb-3">
              <button
                type="button"
                onClick={() => toggleSection("materials")}
                className="w-full py-2 flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-black"
              >
                <span>MATERIALS & CARE</span>
                <span>{openSection === "materials" ? "−" : "+"}</span>
              </button>
              {openSection === "materials" && (
                <div className="pt-2 pb-1 text-xs text-neutral-600 leading-relaxed tracking-tight">
                  <p>{product.materials}</p>
                </div>
              )}
            </div>

            {/* Size Guide Accordion */}
            <div className="border-b border-neutral-200 pb-3">
              <button
                type="button"
                onClick={() => toggleSection("size-guide")}
                className="w-full py-2 flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-black"
              >
                <span>SIZE & FIT GUIDE</span>
                <span>{openSection === "size-guide" ? "−" : "+"}</span>
              </button>
              {openSection === "size-guide" && (
                <div className="pt-2 pb-1 text-xs text-neutral-600 leading-relaxed tracking-tight">
                  <p>{product.sizeGuide}</p>
                  <div className="mt-3 border border-neutral-200 rounded-[8px] overflow-hidden text-[11px]">
                    <div className="grid grid-cols-4 bg-neutral-100 font-bold p-2 text-black text-center">
                      <span>SIZE</span>
                      <span>CHEST</span>
                      <span>LENGTH</span>
                      <span>SLEEVE</span>
                    </div>
                    <div className="grid grid-cols-4 p-2 text-center border-t border-neutral-100">
                      <span className="font-bold">S</span>
                      <span>44 in</span>
                      <span>28 in</span>
                      <span>9.0 in</span>
                    </div>
                    <div className="grid grid-cols-4 p-2 text-center border-t border-neutral-100 bg-neutral-50/50">
                      <span className="font-bold">M</span>
                      <span>46 in</span>
                      <span>29 in</span>
                      <span>9.5 in</span>
                    </div>
                    <div className="grid grid-cols-4 p-2 text-center border-t border-neutral-100">
                      <span className="font-bold">L</span>
                      <span>48 in</span>
                      <span>30 in</span>
                      <span>10.0 in</span>
                    </div>
                    <div className="grid grid-cols-4 p-2 text-center border-t border-neutral-100 bg-neutral-50/50">
                      <span className="font-bold">XL</span>
                      <span>50 in</span>
                      <span>31 in</span>
                      <span>10.5 in</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Shipping & Returns Accordion */}
            <div className="border-b border-neutral-200 pb-3">
              <button
                type="button"
                onClick={() => toggleSection("shipping")}
                className="w-full py-2 flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-black"
              >
                <span>SHIPPING & COMPLIMENTARY RETURNS</span>
                <span>{openSection === "shipping" ? "−" : "+"}</span>
              </button>
              {openSection === "shipping" && (
                <div className="pt-2 pb-1 text-xs text-neutral-600 leading-relaxed tracking-tight">
                  <p>{product.shippingReturns}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 7. Related Products Section */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="mt-24 pt-12 border-t border-neutral-200">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] text-neutral-400 uppercase block mb-1">
                CURATED ROTATION
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-black">
                YOU MAY ALSO LIKE
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold uppercase tracking-wider text-black hover:text-neutral-500 transition-colors inline-flex items-center gap-1"
            >
              VIEW SHOP &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <div
                key={rel.id}
                className="group flex flex-col bg-white border border-neutral-200 rounded-[8px] overflow-hidden"
              >
                <Link
                  href={`/shop/${rel.slug}`}
                  className="block relative aspect-[3/4] w-full bg-neutral-100 overflow-hidden"
                >
                  <Image
                    src={rel.image}
                    alt={rel.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500 grayscale contrast-105"
                  />
                  {rel.tag && (
                    <div className="absolute top-3 left-3 bg-black text-white text-[10px] font-bold tracking-widest px-2.5 py-1 uppercase rounded-[4px]">
                      {rel.tag}
                    </div>
                  )}
                </Link>

                <div className="p-4 flex flex-col flex-1 justify-between gap-3 bg-white">
                  <div>
                    <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                      {rel.category}
                    </span>
                    <Link href={`/shop/${rel.slug}`} className="block mt-0.5">
                      <h3 className="text-xs font-bold tracking-tight text-black uppercase group-hover:text-neutral-600 transition-colors line-clamp-1">
                        {rel.name}
                      </h3>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <span className="text-sm font-black tracking-tight text-black">
                      {rel.currency} {rel.price.toLocaleString()}
                    </span>
                    <Link
                      href={`/shop/${rel.slug}`}
                      className="text-[11px] font-bold tracking-wider uppercase text-black hover:text-neutral-500 underline underline-offset-4"
                    >
                      VIEW
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
