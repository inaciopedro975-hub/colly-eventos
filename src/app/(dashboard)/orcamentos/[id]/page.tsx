import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QuoteEditor } from "../QuoteEditor";

export default async function OrcamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id);

  if (isNaN(numId)) notFound();

  const [quote, products] = await Promise.all([
    prisma.quote.findUnique({
      where: { id: numId },
      include: { items: { include: { product: true } } },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!quote) notFound();

  const serialized = {
    id: quote.id,
    clientName: quote.clientName,
    clientDoc: quote.clientDoc,
    clientAddress: quote.clientAddress,
    clientPhone: quote.clientPhone,
    clientEmail: quote.clientEmail,
    eventDate: quote.eventDate?.toISOString() ?? null,
    eventType: quote.eventType,
    guestCount: quote.guestCount,
    status: quote.status,
    notes: quote.notes,
    paymentTerms: quote.paymentTerms,
    validity: quote.validity,
    discount: quote.discount,
    total: quote.total,
    items: quote.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      notes: item.notes,
      product: item.product,
    })),
  };

  return <QuoteEditor products={products} existing={serialized} />;
}
