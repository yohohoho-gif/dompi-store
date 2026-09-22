"use client";

import { useState, useTransition } from "react";
import { ProductVariant } from "@/lib/catalog";
import { saveProductVariantsAction } from "@/app/admin/actions";

interface VariantManagerProps {
  productId?: string; // Present when editing existing product
  initialVariants: ProductVariant[];
  onChange?: (variants: ProductVariant[]) => void; // Used when creating new product
}

const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "ONE SIZE"];

export default function VariantManager({
  productId,
  initialVariants,
  onChange,
}: VariantManagerProps) {
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
  const [newColor, setNewColor] = useState("");
  const [newSize, setNewSize] = useState("M");
  const [newStock, setNewStock] = useState(5);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleStockChange = (idx: number, stockVal: number) => {
    const updated = [...variants];
    updated[idx] = { ...updated[idx], stock: Math.max(0, Math.floor(stockVal)) };
    setVariants(updated);
    if (onChange) onChange(updated);
  };

  const handleRemoveVariant = (idx: number) => {
    const updated = variants.filter((_, i) => i !== idx);
    setVariants(updated);
    if (onChange) onChange(updated);
  };

  const handleAddVariant = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanColor = newColor.trim();
    const cleanSize = newSize.trim().toUpperCase();

    if (!cleanColor) {
      setErrorMsg("Please specify a color name.");
      return;
    }

    // Check duplicate (color, size)
    const exists = variants.some(
      (v) =>
        v.color.trim().toLowerCase() === cleanColor.toLowerCase() &&
        v.size.trim().toUpperCase() === cleanSize
    );

    if (exists) {
      setErrorMsg(`Variant with color "${cleanColor}" and size "${cleanSize}" already exists.`);
      return;
    }

    const newVar: ProductVariant = {
      id: `temp-${Date.now()}`,
      productId: productId || "new",
      color: cleanColor,
      size: cleanSize,
      stock: Math.max(0, Math.floor(newStock)),
    };

    const updated = [...variants, newVar];
    setVariants(updated);
    if (onChange) onChange(updated);

    // Reset inputs
    setNewColor("");
    setNewStock(5);
  };

  const handleSaveToDatabase = () => {
    if (!productId) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const payload = variants.map((v) => ({
        id: v.id.startsWith("temp-") ? undefined : v.id,
        color: v.color,
        size: v.size,
        stock: v.stock,
      }));

      const res = await saveProductVariantsAction(productId, payload);
      if (res.success) {
        setSuccessMsg("Variants updated successfully.");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Failed to save variants.");
      }
    });
  };

  const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

  return (
    <div className="bg-white border border-neutral-200 rounded-[10px] p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-black">
            Product Variants & Inventory
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage color options, sizing scales, and unit stock availability.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-black block">
            {variants.length} Variants &bull; {totalStock} Total Units
          </span>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] text-xs font-semibold text-red-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-[8px] text-xs font-semibold text-green-800">
          {successMsg}
        </div>
      )}

      {/* Existing Variants Table */}
      <div className="overflow-x-auto border border-neutral-200 rounded-[8px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              <th className="py-2.5 px-3">Color</th>
              <th className="py-2.5 px-3">Size</th>
              <th className="py-2.5 px-3">Stock Units</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {variants.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-neutral-400">
                  No variants configured. Add at least one color and size variant below.
                </td>
              </tr>
            ) : (
              variants.map((v, idx) => (
                <tr key={v.id || `${v.color}-${v.size}-${idx}`} className="hover:bg-neutral-50/50">
                  <td className="py-2.5 px-3 font-semibold text-black uppercase">
                    {v.color}
                  </td>
                  <td className="py-2.5 px-3 font-bold uppercase text-neutral-700">
                    {v.size}
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => handleStockChange(idx, parseInt(e.target.value) || 0)}
                      className="w-24 px-2.5 py-1 bg-neutral-50 border border-neutral-300 rounded-[6px] text-xs font-bold text-black focus:outline-none focus:border-black"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="text-neutral-400 hover:text-red-600 text-xs font-bold uppercase tracking-wider"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add New Variant Row Form */}
      <form
        onSubmit={handleAddVariant}
        className="bg-neutral-50 border border-neutral-200 rounded-[8px] p-4 flex flex-col md:flex-row gap-3 items-end"
      >
        <div className="flex-1 w-full">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
            New Color
          </label>
          <input
            type="text"
            placeholder="e.g. Vintage Black, Bone"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-[6px] text-xs font-medium focus:outline-none focus:border-black"
          />
        </div>

        <div className="w-full md:w-36">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
            Size
          </label>
          <select
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-[6px] text-xs font-bold uppercase text-neutral-800 focus:outline-none focus:border-black cursor-pointer"
          >
            {COMMON_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-28">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
            Initial Stock
          </label>
          <input
            type="number"
            min="0"
            value={newStock}
            onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-[6px] text-xs font-bold text-black focus:outline-none focus:border-black"
          />
        </div>

        <button
          type="submit"
          className="w-full md:w-auto px-4 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-[6px] transition-colors whitespace-nowrap"
        >
          + Add Variant
        </button>
      </form>

      {/* Save Button for existing products */}
      {productId && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleSaveToDatabase}
            className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest rounded-[8px] disabled:opacity-50 transition-colors"
          >
            {isPending ? "Saving Variants..." : "Save Variant Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
