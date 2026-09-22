"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { saveProductImagesAction } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/client";
import {
  uploadProductImage,
  deleteProductImage,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
} from "@/lib/storage";

export interface AdminImageItem {
  id?: string;
  url: string;
  alt: string;
  sortOrder: number;
}

interface ImageManagerProps {
  productId?: string;
  initialImages: AdminImageItem[];
  onChange?: (images: AdminImageItem[]) => void;
}

export default function ImageManager({
  productId,
  initialImages,
  onChange,
}: ImageManagerProps) {
  const [images, setImages] = useState<AdminImageItem[]>(initialImages);
  const [newUrl, setNewUrl] = useState("");
  const [newAlt, setNewAlt] = useState("");
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingStatus, setUploadingStatus] = useState<{
    inProgress: boolean;
    current: number;
    total: number;
    fileName: string;
  } | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const handleMove = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === images.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Re-index sortOrder
    const reindexed = updated.map((img, i) => ({ ...img, sortOrder: i }));
    setImages(reindexed);
    if (onChange) onChange(reindexed);
  };

  const handleAltChange = (index: number, alt: string) => {
    const updated = images.map((img, i) =>
      i === index ? { ...img, alt } : img
    );
    setImages(updated);
    if (onChange) onChange(updated);
  };

  const handleRemove = async (index: number) => {
    const itemToRemove = images[index];
    const updated = images
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, sortOrder: i }));

    setImages(updated);
    if (onChange) onChange(updated);

    // If it's stored in Supabase storage and has no persistent id (or removed), we attempt storage clean up
    if (itemToRemove?.url?.includes("/product-images/")) {
      await deleteProductImage(itemToRemove.url, supabase);
    }
  };

  const handleFilesUpload = async (files: FileList | File[]) => {
    if (!productId) {
      setErrorMsg("Please save the product first before uploading images to storage.");
      return;
    }

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setErrorMsg(`"${file.name}" is not a supported image type (JPG, PNG, WEBP, AVIF).`);
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setErrorMsg(`"${file.name}" exceeds the 10MB file size limit.`);
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const newlyUploaded: AdminImageItem[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setUploadingStatus({
        inProgress: true,
        current: i + 1,
        total: validFiles.length,
        fileName: file.name,
      });

      try {
        const { publicUrl } = await uploadProductImage(file, productId, supabase);
        const autoAlt = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

        newlyUploaded.push({
          id: `temp-${Date.now()}-${i}`,
          url: publicUrl,
          alt: autoAlt || `Product photography angle ${images.length + newlyUploaded.length + 1}`,
          sortOrder: images.length + newlyUploaded.length,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Storage error";
        setErrorMsg(`Failed to upload ${file.name}: ${message}`);
        break;
      }
    }

    setUploadingStatus(null);

    if (newlyUploaded.length > 0) {
      const combined = [...images, ...newlyUploaded].map((img, idx) => ({
        ...img,
        sortOrder: idx,
      }));
      setImages(combined);
      if (onChange) onChange(combined);

      setSuccessMsg(
        `Uploaded ${newlyUploaded.length} image${
          newlyUploaded.length > 1 ? "s" : ""
        } to Supabase Storage. Click 'Save Image Changes' to commit to database.`
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  const handleAddImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUrl = newUrl.trim();
    if (!cleanUrl || !cleanUrl.startsWith("http")) {
      setErrorMsg("Please provide a valid image URL starting with http:// or https://");
      return;
    }

    const newItem: AdminImageItem = {
      id: `temp-${Date.now()}`,
      url: cleanUrl,
      alt: newAlt.trim() || `Product photo angle ${images.length + 1}`,
      sortOrder: images.length,
    };

    const updated = [...images, newItem];
    setImages(updated);
    if (onChange) onChange(updated);

    setNewUrl("");
    setNewAlt("");
    setShowUrlForm(false);
  };

  const handleSaveToDatabase = () => {
    if (!productId) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const payload = images.map((img, i) => ({
        id: img.id?.startsWith("temp-") ? undefined : img.id,
        url: img.url,
        alt: img.alt,
        sortOrder: i,
      }));

      const res = await saveProductImagesAction(productId, payload);
      if (res.success) {
        setSuccessMsg("Product images and sort order updated successfully.");
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        setErrorMsg(res.error || "Failed to save product images.");
      }
    });
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-[10px] p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-black">
            Product Photography & Supabase Storage
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Directly upload high-resolution editorial photography or manage sort order.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-neutral-500">
          {images.length} {images.length === 1 ? "Image" : "Images"}
        </span>
      </div>

      {/* Status Messages */}
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

      {/* Uploading Progress Feedback */}
      {uploadingStatus && (
        <div className="p-4 bg-neutral-900 text-white rounded-[8px] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono uppercase font-bold tracking-wider">
              Uploading to Supabase Storage ({uploadingStatus.current}/{uploadingStatus.total})
            </span>
            <span className="font-mono text-neutral-400 truncate max-w-[200px]">
              {uploadingStatus.fileName}
            </span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-300"
              style={{
                width: `${(uploadingStatus.current / uploadingStatus.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-[10px] p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-black bg-neutral-100"
            : "border-neutral-300 hover:border-black bg-neutral-50/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFilesUpload(e.target.files);
            }
          }}
        />
        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700 mb-1">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            Click to upload or drag & drop product images
          </p>
          <p className="text-[11px] text-neutral-500">
            JPG, PNG, WEBP, AVIF up to 10MB each. Isolated in product folder on Supabase Storage.
          </p>
        </div>
      </div>

      {/* Existing Images Reorder List */}
      <div className="space-y-3">
        {images.length === 0 ? (
          <div className="py-6 text-center border border-dashed border-neutral-200 rounded-[8px] text-xs text-neutral-400">
            No images uploaded yet. Drop images above or enter an external URL.
          </div>
        ) : (
          images.map((img, idx) => (
            <div
              key={img.id || `${img.url}-${idx}`}
              className="flex items-center gap-4 p-3 bg-neutral-50 border border-neutral-200 rounded-[8px]"
            >
              {/* Thumbnail */}
              <div className="relative w-14 h-16 bg-neutral-200 rounded-[6px] overflow-hidden shrink-0 border border-neutral-300">
                <Image
                  src={img.url}
                  alt={img.alt || "Product image"}
                  fill
                  sizes="64px"
                  className="object-cover grayscale contrast-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>

              {/* URL & Alt */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded-[3px]">
                    {idx === 0 ? "Cover (Angle 1)" : `Angle ${idx + 1}`}
                  </span>
                  {img.url.includes("/product-images/") ? (
                    <span className="text-[9px] font-mono uppercase tracking-wider bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded-[2px]">
                      Storage Bucket
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-[2px]">
                      External URL
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={img.alt}
                    onChange={(e) => handleAltChange(idx, e.target.value)}
                    placeholder="Alt text / description"
                    className="w-full text-xs font-medium px-2 py-1 bg-white border border-neutral-300 rounded-[4px] focus:outline-none focus:border-black"
                  />
                </div>
                <p className="text-[10px] font-mono text-neutral-400 truncate">
                  {img.url}
                </p>
              </div>

              {/* Reordering Up / Down Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, "up")}
                  className="p-1.5 bg-white border border-neutral-300 rounded-[4px] text-xs font-bold hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-white"
                  title="Move Up"
                  aria-label="Move Up"
                >
                  &uarr;
                </button>
                <button
                  type="button"
                  disabled={idx === images.length - 1}
                  onClick={() => handleMove(idx, "down")}
                  className="p-1.5 bg-white border border-neutral-300 rounded-[4px] text-xs font-bold hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-white"
                  title="Move Down"
                  aria-label="Move Down"
                >
                  &darr;
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="p-1.5 text-neutral-400 hover:text-red-600 rounded-[4px] text-xs font-bold uppercase ml-2"
                  title="Remove Image"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Fallback Add Image URL Toggle */}
      <div className="border-t border-neutral-200 pt-4">
        {!showUrlForm ? (
          <button
            type="button"
            onClick={() => setShowUrlForm(true)}
            className="text-xs font-bold text-neutral-600 hover:text-black uppercase tracking-wider"
          >
            + Add Image via External URL instead
          </button>
        ) : (
          <form
            onSubmit={handleAddImageUrl}
            className="bg-neutral-50 border border-neutral-200 rounded-[8px] p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                Add Image via External URL
              </h4>
              <button
                type="button"
                onClick={() => setShowUrlForm(false)}
                className="text-xs text-neutral-400 hover:text-black font-bold"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Image URL (HTTP/HTTPS)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-[6px] text-xs font-mono focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Alt Text / Caption
                </label>
                <input
                  type="text"
                  placeholder="Front angle view"
                  value={newAlt}
                  onChange={(e) => setNewAlt(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-[6px] text-xs font-medium focus:outline-none focus:border-black"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-[6px] transition-colors"
              >
                Add URL
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Save Button for existing products */}
      {productId && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={isPending || uploadingStatus?.inProgress}
            onClick={handleSaveToDatabase}
            className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest rounded-[8px] disabled:opacity-50 transition-colors"
          >
            {isPending ? "Saving Images..." : "Save Image Order & Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
