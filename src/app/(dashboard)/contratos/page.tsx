import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContractsClient } from "./ContractsClient";

export default async function ContratosPage() {
  await getServerSession(authOptions);

  const [contracts, quotesAprovados, events] = await Promise.all([
    prisma.contract.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.quote.findMany({
      where: { status: "aprovado" },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.event.findMany({
      where: { status: { not: "cancelado" } },
      select: { id: true, title: true, clientName: true, date: true },
    }),
  ]);

  // Datas já ocupadas no calendário (para alertar conflito de locação)
  const bookedEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    clientName: e.clientName,
    date: e.date.toISOString(),
  }));

  const serialized = contracts.map((c) => ({
    id: c.id,
    type: c.type,
    clientName: c.clientName,
    clientDocType: c.clientDocType,
    clientCpf: c.clientCpf,
    clientRg: c.clientRg,
    clientAddress: c.clientAddress,
    eventType: c.eventType,
    eventStart: c.eventStart.toISOString(),
    eventEnd: c.eventEnd.toISOString(),
    eventLocation: c.eventLocation,
    serviceDescription: c.serviceDescription,
    value: c.value,
    paymentSignalPct: c.paymentSignalPct,
    paymentTerms: c.paymentTerms,
    paymentInstallments: c.paymentInstallments,
    paymentInstallmentValue: c.paymentInstallmentValue,
    extraHourValue: c.extraHourValue,
    signCity: c.signCity,
    signDate: c.signDate.toISOString(),
    notes: c.notes,
    status: c.status,
    quoteId: c.quoteId,
    createdAt: c.createdAt.toISOString(),
  }));

  const quotesForImport = quotesAprovados.map((q) => ({
    id: q.id,
    clientName: q.clientName,
    clientDoc: q.clientDoc,
    clientAddress: q.clientAddress,
    clientPhone: q.clientPhone,
    clientEmail: q.clientEmail,
    eventDate: q.eventDate?.toISOString() ?? null,
    eventType: q.eventType,
    total: q.total,
  }));

  return <ContractsClient initialContracts={serialized} quotesAprovados={quotesForImport} bookedEvents={bookedEvents} />;
}
