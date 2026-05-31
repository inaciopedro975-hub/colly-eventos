import { prisma } from "@/lib/prisma";
import { QuoteEditor } from "../QuoteEditor";

export default async function NovoOrcamentoPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return <QuoteEditor products={products} />;
}
