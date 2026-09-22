import { getAdminProducts, getAdminCategories } from "@/lib/admin";
import ProductTable from "@/components/admin/ProductTable";
import MigrationControl from "@/components/admin/MigrationControl";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();
  const categories = await getAdminCategories();

  const totalImages = products.reduce((acc, p) => acc + p.images.length, 0);
  const externalImages = products.reduce(
    (acc, p) =>
      acc + p.images.filter((img) => !img.url.includes("/product-images/")).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-[10px] font-bold tracking-[0.25em] text-neutral-400 uppercase block mb-1">
            CATALOG INVENTORY
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tight text-black">
            PRODUCTS & VARIANTS
          </h1>
        </div>
      </div>

      {/* Migration Control Banner */}
      <MigrationControl
        externalCount={externalImages}
        totalCount={totalImages}
      />

      {/* Main Table */}
      <ProductTable initialProducts={products} categories={categories} />
    </div>
  );
}
