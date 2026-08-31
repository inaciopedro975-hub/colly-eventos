import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(contracts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    type,
    clientName, clientDocType, clientCpf, clientRg, clientAddress,
    eventType, eventStart, eventEnd, eventLocation,
    serviceDescription,
    value, paymentSignalPct, paymentTerms, paymentInstallments, paymentInstallmentValue, extraHourValue,
    signCity, signDate,
    notes, quoteId,
  } = body;

  const contractType = type === "locacao" ? "locacao" : "decoracao";
  const docType = clientDocType === "cnpj" ? "cnpj" : "cpf";
  // Serviços (Cláusula 3ª) só é obrigatório na decoração
  const missingServices = contractType === "decoracao" && !serviceDescription;
  // RG é obrigatório para pessoa física; a Inscrição Estadual (PJ) pode ser isenta
  const missingDoc = !clientCpf || (docType === "cpf" && !clientRg);

  if (!clientName || missingDoc || !clientAddress || !eventStart || !eventEnd || value === undefined || missingServices) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const contract = await prisma.contract.create({
    data: {
      type: contractType,
      clientName,
      clientDocType: docType,
      clientCpf,
      clientRg: clientRg || "",
      clientAddress,
      eventType: eventType || "casamento",
      eventStart: new Date(eventStart),
      eventEnd: new Date(eventEnd),
      eventLocation: eventLocation || "Colly Eventos, em Amparo/SP",
      serviceDescription: serviceDescription || null,
      value: parseFloat(value),
      paymentSignalPct: paymentSignalPct !== undefined ? parseFloat(paymentSignalPct) : 20,
      paymentTerms: paymentTerms || null,
      paymentInstallments: paymentInstallments ? parseInt(paymentInstallments) : null,
      paymentInstallmentValue: paymentInstallmentValue ? parseFloat(paymentInstallmentValue) : null,
      extraHourValue: extraHourValue ? parseFloat(extraHourValue) : null,
      signCity: signCity || "Amparo",
      signDate: signDate ? new Date(signDate) : new Date(),
      notes: notes || null,
      quoteId: quoteId ? parseInt(quoteId) : null,
    },
  });

  return NextResponse.json(contract, { status: 201 });
}
