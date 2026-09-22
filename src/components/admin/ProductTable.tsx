"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { AdminProductSummary } from "@/lib/admin";
import { toggleProductActiveAction } from "@/app/admin/actions";

interface ProductTableProps {
  initialProducts: AdminProductSummary[];
  categories: { id: string; name: string; slug: string }[];
}

export default function ProductTable({ initialProducts, categories }: ProductTableProps) {
  const [products, setProducts] = useState<AdminProductSummary[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter products
  const filtered = useMemo(() => {
    return products.filter((p) => {
      // Search
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase());

      // Category
      const matchesCategory =
        categoryFilter === "ALL" || p.categoryId === categoryFilter;

      // Status
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && p.isActive) ||
        (statusFilter === "INACTIVE" && !p.isActive);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  // Handle Active Status Toggle
  const handleToggleActive = (productId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setTogglingId(productId);

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isActive: nextStatus } : p))
    );

    startTransition(async () => {
      const res = await toggleProductActiveAction(productId, nextStatus);
      setTogglingId(null);
      if (res.success) {
        showToast(`Product set to ${nextStatus ? "Active" : "Inactive"}`);
      } else {
        // Rollback
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, isActive: currentStatus } : p))
        );
        showToast(res.error || "Failed to update status", true);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-[8px] text-xs font-bold uppercase tracking-wider shadow-lg transition-all ${
            toastMessage.isError
              ? "bg-red-600 text-white"
              : "bg-black text-white"
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      {/* Control Bar: Search & Filters */}
      <div className="bg-white border border-neutral-200 rounded-[10px] p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search products by title or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-[8px] text-xs font-medium focus:bg-white focus:outline-none focus:border-black transition-colors"
            />
            <svg
              className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-[8px] text-xs font-bold uppercase tracking-wider text-neutral-700 focus:bg-white focus:outline-none focus:border-black cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Tabs & Action CTA */}
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <div className="inline-flex rounded-[8px] border border-neutral-200 bg-neutral-50 p-0.5">
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-[6px] transition-colors ${
                  statusFilter === tab
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-500 hover:text-black"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-[8px] hover:bg-neutral-800 transition-colors whitespace-nowrap"
          >
            + Create Product
          </Link>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-neutral-200 rounded-[10px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
                <th className="py-3 px-4">Piece</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price (THB)</th>
                <th className="py-3 px-4">Variants & Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-neutral-400">
                    <p className="font-semibold text-sm text-black mb-1">No products match your filters</p>
                    <p className="text-xs text-neutral-500">Try changing your search keywords or resetting category filters.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const isBusy = isPending && togglingId === prod.id;
                  const thumb = prod.images[0]?.url || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200";

                  return (
                    <tr key={prod.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Product Thumbnail & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-14 bg-neutral-100 rounded-[6px] overflow-hidden shrink-0 border border-neutral-200">
                            <Image
                              src={thumb}
                              alt={prod.name}
                              fill
                              sizes="48px"
                              className="object-cover grayscale contrast-105"
                            />
                          </div>
                          <div>
                            <Link
                              href={`/admin/products/${prod.id}`}
                              className="font-bold text-black uppercase hover:underline line-clamp-1"
                            >
                              {prod.name}
                            </Link>
                            <span className="text-[11px] font-mono text-neutral-400 block">
                              /{prod.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 bg-neutral-100 text-neutral-800 text-[10px] font-bold uppercase tracking-wider rounded-[4px]">
                          {prod.categoryName}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-black text-black whitespace-nowrap">
                        THB {prod.price.toLocaleString()}
                      </td>

                      {/* Variants & Stock */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-neutral-800">
                            {prod.totalStock} units available
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            across {prod.variantCount} variants
                          </span>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleActive(prod.id, prod.isActive)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${
                            prod.isActive
                              ? "bg-green-100 text-green-800 border border-green-200 hover:bg-green-200"
                              : "bg-neutral-100 text-neutral-500 border border-neutral-200 hover:bg-neutral-200"
                          } ${isBusy ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
                          title="Click to toggle visibility"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              prod.isActive ? "bg-green-600" : "bg-neutral-400"
                            }`}
                          />
                          {prod.isActive ? "ACTIVE" : "INACTIVE"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                        <Link
                          href={`/admin/products/${prod.id}`}
                          className="inline-block px-3 py-1 bg-neutral-100 hover:bg-black hover:text-white text-black text-[11px] font-bold uppercase tracking-wider rounded-[6px] transition-colors"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/shop/${prod.slug}`}
                          target="_blank"
                          className="inline-block px-2 py-1 text-neutral-400 hover:text-black text-[11px] font-bold uppercase tracking-wider transition-colors"
                          title="View on live storefront"
                        >
                          View ↗
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="bg-neutral-50 border-t border-neutral-200 px-4 py-3 flex items-center justify-between text-xs text-neutral-500">
          <span>
            Showing <strong className="text-black">{filtered.length}</strong> of{" "}
            <strong className="text-black">{products.length}</strong> total products
          </span>
        </div>
      </div>
    </div>
  );
}
