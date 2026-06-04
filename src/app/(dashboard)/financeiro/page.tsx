import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FinanceiroClient } from "./FinanceiroClient";

export default async function FinanceiroPage() {
  await getServerSession(authOptions);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [transactions, quotesAprovados] = await Promise.all([
    prisma.transaction.findMany({ orderBy: { date: "desc" } }),
    prisma.quote.findMany({
      where: { status: "aprovado" },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  // Serializar datas para o client
  const serialized = transactions.map((t) => ({
    id: t.id,
    type: t.type,
    category: t.category,
    description: t.description,
    amount: t.amount,
    date: t.date.toISOString(),
    status: t.status,
    paymentMethod: t.paymentMethod,
    notes: t.notes,
    installmentGroup: t.installmentGroup,
    installmentNum: t.installmentNum,
    totalInstallments: t.totalInstallments,
    quoteId: t.quoteId,
    eventId: t.eventId,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  const quotesForImport = quotesAprovados.map((q) => ({
    id: q.id,
    clientName: q.clientName,
    total: q.total,
    eventDate: q.eventDate?.toISOString() ?? null,
    createdAt: q.createdAt.toISOString(),
  }));

  return <FinanceiroClient initialTransactions={serialized} quotesAprovados={quotesForImport} />;
}
