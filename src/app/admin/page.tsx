import Link from "next/link";
import { getAdminStats, getAdminProducts } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();
  const allProducts = await getAdminProducts();
  const recentProducts = allProducts.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Overview Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-[10px] font-bold tracking-[0.25em] text-neutral-400 uppercase block mb-1">
            STUDIO OVERVIEW
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tight text-black">
            CATALOG DASHBOARD
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider rounded-[8px] transition-colors"
          >
            Manage Products
          </Link>
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-[8px] hover:bg-neutral-800 transition-colors"
          >
            + New Piece
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Products */}
        <div className="bg-white border border-neutral-200 rounded-[10px] p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Total Catalog
          </span>
          <div className="text-3xl font-black text-black">
            {stats.totalProducts}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Garment definitions
          </span>
        </div>

        {/* Card 2: Active Storefront Items */}
        <div className="bg-white border border-neutral-200 rounded-[10px] p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 block mb-1">
            Active Online
          </span>
          <div className="text-3xl font-black text-green-700">
            {stats.activeProducts}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Purchasable on /shop
          </span>
        </div>

        {/* Card 3: Inactive Drafts */}
        <div className="bg-white border border-neutral-200 rounded-[10px] p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Hidden / Drafts
          </span>
          <div className="text-3xl font-black text-neutral-700">
            {stats.inactiveProducts}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Unlisted from catalog
          </span>
        </div>

        {/* Card 4: Total Inventory Units */}
        <div className="bg-white border border-neutral-200 rounded-[10px] p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Total Inventory
          </span>
          <div className="text-3xl font-black text-black">
            {stats.totalInventory}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Units across all variants
          </span>
        </div>
      </div>

      {/* Quick Recent Products List */}
      <div className="bg-white border border-neutral-200 rounded-[10px] overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-black">
            Recent Catalog Pieces
          </h3>
          <Link
            href="/admin/products"
            className="text-xs font-semibold text-neutral-500 hover:text-black uppercase underline underline-offset-2"
          >
            View All ({allProducts.length}) &rarr;
          </Link>
        </div>

        <div className="divide-y divide-neutral-100 text-xs">
          {recentProducts.map((p) => (
            <div key={p.id} className="p-4 flex items-center justify-between hover:bg-neutral-50/60 transition-colors">
              <div>
                <Link
                  href={`/admin/products/${p.id}`}
                  className="font-bold text-black uppercase hover:underline"
                >
                  {p.name}
                </Link>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500">
                  <span>{p.categoryName}</span>
                  <span>&bull;</span>
                  <span className="font-mono">THB {p.price.toLocaleString()}</span>
                  <span>&bull;</span>
                  <span>{p.totalStock} in stock</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    p.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {p.isActive ? "Active" : "Inactive"}
                </span>
                <Link
                  href={`/admin/products/${p.id}`}
                  className="px-3 py-1 bg-neutral-100 hover:bg-black hover:text-white rounded-[6px] font-bold uppercase text-[10px] transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
