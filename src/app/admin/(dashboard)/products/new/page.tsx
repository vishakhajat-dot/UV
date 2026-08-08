import { prisma } from "@/lib/db";
import ProductForm from "@/components/ProductForm";

export const revalidate = 0;

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy dark:text-white">Add Product</h1>
      <div className="mt-6">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
