import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { ContractPDF } from "@/lib/contract-pdf";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pdfData = {
    type: contract.type,
    clientName: contract.clientName,
    clientDocType: contract.clientDocType,
    clientCpf: contract.clientCpf,
    clientRg: contract.clientRg,
    clientAddress: contract.clientAddress,
    eventType: contract.eventType,
    eventStart: contract.eventStart,
    eventEnd: contract.eventEnd,
    eventLocation: contract.eventLocation,
    serviceDescription: contract.serviceDescription,
    value: contract.value,
    paymentSignalPct: contract.paymentSignalPct,
    paymentTerms: contract.paymentTerms,
    paymentInstallments: contract.paymentInstallments,
    paymentInstallmentValue: contract.paymentInstallmentValue,
    extraHourValue: contract.extraHourValue,
    signCity: contract.signCity,
    signDate: contract.signDate,
  };

  const buffer = await renderToBuffer(ContractPDF({ data: pdfData }));
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

  const safeName = contract.clientName.replace(/[^a-zA-Z0-9]/g, "_");

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="contrato-${safeName}.pdf"`,
    },
  });
}
