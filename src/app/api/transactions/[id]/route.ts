import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { type, category, description, amount, date, status, paymentMethod, notes, quoteId, eventId } = body;

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      type,
      category,
      description,
      amount: parseFloat(amount),
      date: new Date(date),
      status: status || "recebido",
      paymentMethod: paymentMethod || null,
      notes: notes || null,
      quoteId: quoteId ? parseInt(quoteId) : null,
      eventId: eventId || null,
    },
  });

  return NextResponse.json(transaction);
}

// Marca parcela como recebida (atalho)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const transaction = await prisma.transaction.update({
    where: { id },
    data: { status: "recebido" },
  });

  return NextResponse.json(transaction);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Se for parte de um grupo, apaga todas as parcelas do grupo
  const t = await prisma.transaction.findUnique({ where: { id } });
  if (t?.installmentGroup) {
    await prisma.transaction.deleteMany({ where: { installmentGroup: t.installmentGroup } });
  } else {
    await prisma.transaction.delete({ where: { id } });
  }

  return NextResponse.json({ ok: true });
}
