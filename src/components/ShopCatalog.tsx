"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Product } from "@/data/products";
import { CatalogCategory, ProductWithVariants } from "@/lib/catalog";

interface ShopCatalogProps {
  initialProducts: (Product | ProductWithVariants)[];
  categories: CatalogCategory[];
  initialCategory?: string;
  initialQuery?: string;
}

type SortOption = "featured" | "newest" | "price-asc" | "price-desc";

function resolveCategorySlug(
  param: string | null | undefined,
  availableCategories: CatalogCategory[]
): string {
  if (!param) return "all";
  const normalized = param.trim().toLowerCase();
  if (normalized === "all") return "all";

  // Match against slug first, or case-insensitive name as fallback
  const matched = availableCategories.find(
    (c) =>
      c.slug.toLowerCase() === normalized ||
      c.name.toLowerCase() === normalized
  );

  return matched ? matched.slug : "all";
}

export default function ShopCatalog({
  initialProducts,
  categories,
  initialCategory,
  initialQuery,
}: ShopCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [selectedSort, setSelectedSort] = useState<SortOption>("featured");

  const activeCategorySlug = useMemo(() => {
    const param = searchParams.get("category") ?? initialCategory;
    return resolveCategorySlug(param, categories);
  }, [searchParams, initialCategory, categories]);

  const activeCategoryName = useMemo(() => {
    if (activeCategorySlug === "all") return "ALL";
    const matched = categories.find(
      (c) => c.slug.toLowerCase() === activeCategorySlug.toLowerCase()
    );
    return matched ? matched.name : activeCategorySlug;
  }, [activeCategorySlug, categories]);

  const allCategoryOptions = useMemo(() => {
    return [
      { id: "all", name: "ALL", slug: "all" },
      ...categories,
    ];
  }, [categories]);

  const activeQuery = useMemo(() => {
    const param = searchParams.get("q") ?? initialQuery ?? "";
    return param.trim();
  }, [searchParams, initialQuery]);

  const updateUrlParams = (updates: {
    category?: string | null;
    q?: string | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.category !== undefined) {
      if (updates.category === null || updates.category.toLowerCase() === "all") {
        params.delete("category");
      } else {
        params.set("category", updates.category.toLowerCase());
      }
    }

    if (updates.q !== undefined) {
      if (updates.q === null || updates.q.trim() === "") {
        params.delete("q");
      } else {
        params.set("q", updates.q.trim());
      }
    }

    const queryString = params.toString();
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(targetUrl, { scroll: false });
  };

  const handleSelectCategory = (slug: string) => {
    updateUrlParams({ category: slug === "all" ? null : slug });
  };

  const handleClearSearch = () => {
    updateUrlParams({ q: null });
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list: Product[] = [...initialProducts];

    // 1. Filter by Category
    if (activeCategorySlug !== "all") {
      list = list.filter((p) => {
        const pWithVariants = p as ProductWithVariants;
        if (pWithVariants.categorySlug) {
          return pWithVariants.categorySlug.toLowerCase() === activeCategorySlug.toLowerCase();
        }
        return p.category.toLowerCase().replace(/\s+/g, "-") === activeCategorySlug.toLowerCase();
      });
    }

    // 2. Filter by Search Query
    if (activeQuery) {
      const term = activeQuery.toLowerCase();
      list = list.filter((p) => {
        const nameMatch = p.name ? p.name.toLowerCase().includes(term) : false;
        const catMatch = p.category ? p.category.toLowerCase().includes(term) : false;
        const descMatch = p.description ? p.description.toLowerCase().includes(term) : false;
        return nameMatch || catMatch || descMatch;
      });
    }

    // 3. Sort
    if (selectedSort === "featured") {
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    } else if (selectedSort === "newest") {
      list.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } else if (selectedSort === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (selectedSort === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [initialProducts, activeCategorySlug, activeQuery, selectedSort]);

  return (
    <>
      {/* Shop Header */}
      <header className="mb-10 pb-6 border-b border-neutral-200">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-[0.25em] text-neutral-400 uppercase block mb-1">
              CATALOG ARCHIVE
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black uppercase">
              SHOP
            </h1>
            <p className="mt-2 text-sm text-neutral-500 font-normal max-w-xl tracking-tight">
              Curated architectural streetwear silhouettes engineered for daily rotation. Heavyweight organic textiles with clean monochrome finishes.
            </p>
            {activeQuery && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-neutral-500 font-medium">
                  Search results for: <span className="text-black font-bold">&ldquo;{activeQuery}&rdquo;</span>
                </span>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-[11px] font-bold tracking-wider uppercase text-neutral-400 hover:text-black transition-colors underline underline-offset-2 ml-1"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>

          <div className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            Showing <span className="text-black font-bold">{filteredProducts.length}</span> {filteredProducts.length === 1 ? "Piece" : "Pieces"}
          </div>
        </div>
      </header>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-neutral-100">
        {/* Category Filter Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {allCategoryOptions.map((cat) => {
            const isActive = activeCategorySlug === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => handleSelectCategory(cat.slug)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[8px] transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-black text-white"
                    : "bg-white text-neutral-600 border border-neutral-200 hover:border-black hover:text-black"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <label htmlFor="sort-select" className="text-xs font-bold uppercase tracking-wider text-neutral-500 whitespace-nowrap">
            SORT BY:
          </label>
          <div className="relative">
            <select
              id="sort-select"
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as SortOption)}
              className="appearance-none bg-white border border-neutral-300 rounded-[8px] px-3.5 py-2 pr-8 text-xs font-semibold uppercase tracking-wider text-black focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-black">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-neutral-200 rounded-[8px] my-8 px-4">
          <h3 className="text-base font-bold uppercase tracking-tight text-black mb-2">
            No products found
          </h3>
          {activeQuery ? (
            <div className="space-y-4">
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                No pieces matching &ldquo;<span className="text-black font-semibold">{activeQuery}</span>&rdquo;
                {activeCategorySlug !== "all" ? (
                  <> were found in the <span className="text-black font-semibold">{activeCategoryName}</span> category</>
                ) : (
                  <> were found</>
                )}.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-[8px] hover:bg-neutral-800 transition-colors"
                >
                  Clear Search
                </button>
                {activeCategorySlug !== "all" && (
                  <button
                    type="button"
                    onClick={() => updateUrlParams({ category: "all", q: null })}
                    className="px-6 py-2.5 bg-white text-neutral-700 border border-neutral-300 text-xs font-bold uppercase tracking-wider rounded-[8px] hover:border-black hover:text-black transition-colors"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                There are no products currently matching this category filter.
              </p>
              <button
                type="button"
                onClick={() => handleSelectCategory("all")}
                className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-[8px] hover:bg-neutral-800 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {filteredProducts.map((product) => {
            const variants = (product as { variants?: { stock: number }[] }).variants;
            const isSoldOut =
              variants && variants.length > 0
                ? variants.every((v) => (v.stock || 0) <= 0)
                : (product.stock ?? 0) <= 0;

            return (
              <div
                key={product.id}
                className="group flex flex-col bg-white border border-neutral-200 rounded-[8px] overflow-hidden"
              >
                {/* Clickable Image & Details linking to Detail Page */}
                <Link
                  href={`/shop/${product.slug}`}
                  className="block relative aspect-[3/4] w-full bg-neutral-100 overflow-hidden cursor-pointer"
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500 grayscale contrast-105"
                  />

                  {/* Badge Tag */}
                  {isSoldOut ? (
                    <div className="absolute top-3 left-3 bg-neutral-900 text-neutral-300 text-[10px] font-bold tracking-widest px-2.5 py-1 uppercase rounded-[4px]">
                      SOLD OUT
                    </div>
                  ) : product.tag ? (
                    <div className="absolute top-3 left-3 bg-black text-white text-[10px] font-bold tracking-widest px-2.5 py-1 uppercase rounded-[4px]">
                      {product.tag}
                    </div>
                  ) : null}
                </Link>

                {/* Product Details */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3 bg-white">
                  <div>
                    <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                      {product.category}
                    </span>
                    <Link
                      href={`/shop/${product.slug}`}
                      className="block mt-0.5"
                    >
                      <h3 className="text-xs font-bold tracking-tight text-black uppercase group-hover:text-neutral-600 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <span className="text-sm font-black tracking-tight text-black">
                      {product.currency} {product.price.toLocaleString()}
                    </span>
                    {isSoldOut ? (
                      <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-400 select-none">
                        SOLD OUT
                      </span>
                    ) : (
                      <Link
                        href={`/shop/${product.slug}`}
                        className="text-[11px] font-bold tracking-wider uppercase text-black hover:text-neutral-500 underline underline-offset-4"
                      >
                        SELECT OPTIONS
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
