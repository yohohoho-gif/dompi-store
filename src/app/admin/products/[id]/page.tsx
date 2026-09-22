import Link from "next/link";
import { getAdminProductById, getAdminCategories } from "@/lib/admin";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

interface AdminEditProductProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditProductPage({ params }: AdminEditProductProps) {
  const { id } = await params;
  const product = await getAdminProductById(id);
  const categories = await getAdminCategories();

  if (!product) {
    return (
      <div className="py-20 text-center bg-white border border-neutral-200 rounded-[10px] p-8 max-w-lg mx-auto space-y-4">
        <h2 className="text-xl font-bold uppercase tracking-tight text-black">
          Product Not Located
        </h2>
        <p className="text-xs text-neutral-500">
          The product ID could not be found in the database.
        </p>
        <Link
          href="/admin/products"
          className="inline-block px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-[8px]"
        >
          Return to Products Table
        </Link>
      </div>
    );
  }

  return <ProductForm initialProduct={product} categories={categories} />;
}
