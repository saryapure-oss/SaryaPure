import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";
import { VariantsPanel } from "@/components/admin/variants-panel";
import { ProductImagesPanel } from "@/components/admin/product-images-panel";
import { GiftBoxPanel } from "@/components/admin/gift-box-panel";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { include: { inventory: true }, orderBy: { sortOrder: "asc" } },
        giftBox: { include: { items: { include: { variant: { select: { id: true, name: true, sku: true, price: true, product: { select: { name: true } } } } } } } },
      },
    }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">{product.name}</h1>
        <p className="mt-1 text-sm text-muted">SKU {product.sku}</p>
      </div>

      <ProductForm categories={categories} product={{ ...product, taxRate: product.taxRate.toString() }} />

      <ProductImagesPanel productId={product.id} images={product.images} />

      <VariantsPanel productId={product.id} variants={product.variants} />

      <GiftBoxPanel productId={product.id} giftBox={product.giftBox} />
    </div>
  );
}
