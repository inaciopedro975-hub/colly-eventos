import { prisma } from "@/lib/prisma";
import { QuotesClient } from "./QuotesClient";

export default async function OrcamentosPage() {
  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized = quotes.map((q) => ({
    id: q.id,
    clientName: q.clientName,
    clientPhone: q.clientPhone,
    clientEmail: q.clientEmail,
    eventDate: q.eventDate?.toISOString() ?? null,
    eventType: q.eventType,
    status: q.status,
    total: q.total,
    createdAt: q.createdAt.toISOString(),
  }));

  return <QuotesClient initialQuotes={serialized} />;
}
