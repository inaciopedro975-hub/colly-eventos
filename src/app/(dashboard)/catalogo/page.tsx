import { prisma } from "@/lib/prisma";
import { CatalogClient } from "./CatalogClient";

export default async function CatalogoPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return <CatalogClient initialProducts={products} />;
}
