import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id: parseInt(id) },
    include: { items: { include: { product: true } } },
  });
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(quote);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numId = parseInt(id);
  const body = await req.json();
  const {
    clientName, clientDoc, clientAddress, clientPhone, clientEmail,
    eventDate, eventType, guestCount, status, notes,
    paymentTerms, validity, discount, items,
  } = body;

  const itemsTotal = (items ?? []).reduce(
    (sum: number, item: { quantity: number; unitPrice: number }) =>
      sum + item.quantity * item.unitPrice,
    0
  );
  const discountVal = parseFloat(discount ?? 0);
  const total = itemsTotal - discountVal;

  await prisma.quoteItem.deleteMany({ where: { quoteId: numId } });

  const quote = await prisma.quote.update({
    where: { id: numId },
    data: {
      clientName,
      clientDoc: clientDoc || null,
      clientAddress: clientAddress || null,
      clientPhone: clientPhone || null,
      clientEmail: clientEmail || null,
      eventDate: eventDate ? new Date(eventDate) : null,
      eventType: eventType || null,
      guestCount: guestCount ? parseInt(guestCount) : null,
      status,
      notes: notes || null,
      paymentTerms: paymentTerms || null,
      validity: validity || "30 dias",
      discount: discountVal,
      total,
      items: {
        create: (items ?? []).map((item: { productId: string; quantity: number; unitPrice: number; notes?: string }) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          notes: item.notes || null,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  });

  return NextResponse.json(quote);
}

// Atualização parcial — usado para mudar status rapidamente (Aprovar/Rejeitar)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!status || !["rascunho", "enviado", "aprovado", "rejeitado"].includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const quote = await prisma.quote.update({
    where: { id: parseInt(id) },
    data: { status },
  });
  return NextResponse.json(quote);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.quote.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
