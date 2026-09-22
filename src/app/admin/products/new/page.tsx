import { getAdminCategories } from "@/lib/admin";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function AdminNewProductPage() {
  const categories = await getAdminCategories();

  return <ProductForm categories={categories} />;
}
