import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ProductForm from "@/components/ProductForm";

export const revalidate = 0;

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id: params.id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy">Edit Item</h1>
      <div className="mt-6">
        <ProductForm categories={categories} initial={product} />
      </div>
    </div>
  );
}
