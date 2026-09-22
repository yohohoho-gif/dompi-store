"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminProductSummary } from "@/lib/admin";
import VariantManager from "@/components/admin/VariantManager";
import ImageManager, { AdminImageItem } from "@/components/admin/ImageManager";
import {
  createProductAction,
  updateProductAction,
} from "@/app/admin/actions";
import { ProductVariant } from "@/lib/catalog";

interface ProductFormProps {
  initialProduct?: AdminProductSummary; // Present if editing
  categories: { id: string; name: string; slug: string }[];
}

export default function ProductForm({ initialProduct, categories }: ProductFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialProduct);

  const [name, setName] = useState(initialProduct?.name || "");
  const [slug, setSlug] = useState(initialProduct?.slug || "");
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [price, setPrice] = useState(initialProduct?.price ? String(initialProduct.price) : "");
  const [categoryId, setCategoryId] = useState(initialProduct?.categoryId || categories[0]?.id || "");
  const [isActive, setIsActive] = useState(initialProduct ? initialProduct.isActive : true);

  // Initial child states for new products
  const [newVariants, setNewVariants] = useState<ProductVariant[]>(
    initialProduct?.variants || [
      { id: "var-1", productId: "new", color: "Vintage Black", size: "M", stock: 10 },
    ]
  );
  const [newImages, setNewImages] = useState<AdminImageItem[]>(
    initialProduct?.images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt || "",
      sortOrder: img.sortOrder,
    })) || []
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Auto-generate slug when name changes for new products
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

  const handleSaveAttributes = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const numPrice = parseFloat(price);
    if (!name.trim()) return setErrorMsg("Product name is required.");
    if (!slug.trim()) return setErrorMsg("Product slug is required.");
    if (isNaN(numPrice) || numPrice < 0) return setErrorMsg("Price must be a valid positive number.");
    if (!categoryId) return setErrorMsg("Please choose a category.");

    startTransition(async () => {
      if (isEditing && initialProduct) {
        // Update product attributes
        const res = await updateProductAction(initialProduct.id, {
          name,
          slug,
          description,
          price: numPrice,
          categoryId,
          isActive,
        });

        if (res.success) {
          setSuccessMsg("Product attributes saved successfully.");
          setTimeout(() => setSuccessMsg(null), 3000);
        } else {
          setErrorMsg(res.error || "Failed to update product.");
        }
      } else {
        // Create full new product with variants and images
        const res = await createProductAction({
          name,
          slug,
          description,
          price: numPrice,
          categoryId,
          isActive,
          variants: newVariants.map((v) => ({
            color: v.color,
            size: v.size,
            stock: v.stock,
          })),
          images: newImages.map((img, idx) => ({
            url: img.url,
            alt: img.alt,
            sortOrder: idx,
          })),
        });

        if (res.success && res.data?.id) {
          router.push(`/admin/products/${res.data.id}`);
        } else {
          setErrorMsg(res.error || "Failed to create product.");
        }
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <Link
            href="/admin/products"
            className="text-xs font-semibold text-neutral-400 hover:text-black uppercase tracking-wider block mb-1"
          >
            &larr; Back to Catalog Table
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            {isEditing ? `Edit: ${initialProduct?.name}` : "Create New Catalog Piece"}
          </h1>
        </div>

        {isEditing && (
          <div className="flex items-center gap-3">
            <Link
              href={`/shop/${slug}`}
              target="_blank"
              className="px-3.5 py-2 bg-neutral-100 hover:bg-black hover:text-white text-black text-xs font-bold uppercase tracking-wider rounded-[8px] transition-colors"
            >
              View on Storefront ↗
            </Link>
          </div>
        )}
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-[8px] text-xs font-bold text-red-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-[8px] text-xs font-bold text-green-800">
          {successMsg}
        </div>
      )}

      {/* 1. Core Attributes Form */}
      <form
        onSubmit={handleSaveAttributes}
        className="bg-white border border-neutral-200 rounded-[10px] p-6 space-y-6 shadow-sm"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-black">
            Basic Product Attributes
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            {isEditing ? "UUID: " + initialProduct?.id : "New Item"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
              Product Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. RAW EDGES OVERSIZED TEE"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-[8px] text-xs font-bold uppercase text-black focus:bg-white focus:outline-none focus:border-black"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
              URL Slug *
            </label>
            <input
              type="text"
              required
              placeholder="raw-edges-oversized-tee"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-[8px] text-xs font-mono font-medium text-neutral-800 focus:bg-white focus:outline-none focus:border-black"
            />
            <p className="text-[11px] text-neutral-400 mt-1">
              Storefront route: /shop/<span className="text-black font-semibold">{slug || "..."}</span>
            </p>
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
              Price (THB) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-neutral-400">
                THB
              </span>
              <input
                type="number"
                step="1"
                min="0"
                required
                placeholder="1890"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full pl-14 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-[8px] text-xs font-black text-black focus:bg-white focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-[8px] text-xs font-bold uppercase tracking-wider text-black focus:bg-white focus:outline-none focus:border-black cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
            Editorial Description
          </label>
          <textarea
            rows={4}
            placeholder="Fabric specs, GSM weight, tailoring fit details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-[8px] text-xs font-normal text-neutral-800 leading-relaxed focus:bg-white focus:outline-none focus:border-black"
          />
        </div>

        {/* Active Toggle Switch */}
        <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-[8px]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-black block">
              Storefront Visibility
            </span>
            <span className="text-[11px] text-neutral-500">
              When active, this item appears in /shop catalog and is available for customer purchase.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
              isActive
                ? "bg-black text-white"
                : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
            }`}
          >
            {isActive ? "Status: Active" : "Status: Draft/Hidden"}
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest rounded-[8px] disabled:opacity-50 transition-colors shadow-sm"
          >
            {isPending ? "Saving..." : isEditing ? "Update Product Details" : "Create Product"}
          </button>
        </div>
      </form>

      {/* 2. Embedded Images Manager */}
      <ImageManager
        productId={initialProduct?.id}
        initialImages={
          initialProduct?.images.map((img) => ({
            id: img.id,
            url: img.url,
            alt: img.alt || "",
            sortOrder: img.sortOrder,
          })) || newImages
        }
        onChange={setNewImages}
      />

      {/* 3. Embedded Variants Manager */}
      <VariantManager
        productId={initialProduct?.id}
        initialVariants={initialProduct?.variants || newVariants}
        onChange={setNewVariants}
      />
    </div>
  );
}
