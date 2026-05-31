import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contract);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const {
    type,
    clientName, clientCpf, clientRg, clientAddress,
    eventType, eventStart, eventEnd, eventLocation,
    serviceDescription,
    value, paymentSignalPct, paymentInstallments, paymentInstallmentValue, extraHourValue,
    signCity, signDate,
    notes, status,
  } = body;

  const contract = await prisma.contract.update({
    where: { id },
    data: {
      type: type === "locacao" ? "locacao" : "decoracao",
      clientName,
      clientCpf,
      clientRg,
      clientAddress,
      eventType,
      eventStart: new Date(eventStart),
      eventEnd: new Date(eventEnd),
      eventLocation,
      serviceDescription: serviceDescription || null,
      value: parseFloat(value),
      paymentSignalPct: parseFloat(paymentSignalPct),
      paymentInstallments: paymentInstallments ? parseInt(paymentInstallments) : null,
      paymentInstallmentValue: paymentInstallmentValue ? parseFloat(paymentInstallmentValue) : null,
      extraHourValue: extraHourValue ? parseFloat(extraHourValue) : null,
      signCity,
      signDate: new Date(signDate),
      notes: notes || null,
      status: status || undefined,
    },
  });
  return NextResponse.json(contract);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!status || !["gerado", "assinado", "cancelado"].includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const contract = await prisma.contract.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json(contract);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.contract.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
