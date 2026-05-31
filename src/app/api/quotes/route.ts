import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
  });
  return NextResponse.json(quotes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    clientName, clientDoc, clientAddress, clientPhone, clientEmail,
    eventDate, eventType, guestCount, status, notes,
    paymentTerms, validity, discount, items,
  } = body;

  if (!clientName) {
    return NextResponse.json({ error: "Client name required" }, { status: 400 });
  }

  const itemsTotal = (items ?? []).reduce(
    (sum: number, item: { quantity: number; unitPrice: number }) =>
      sum + item.quantity * item.unitPrice,
    0
  );
  const discountVal = parseFloat(discount ?? 0);
  const total = itemsTotal - discountVal;

  const quote = await prisma.quote.create({
    data: {
      clientName,
      clientDoc: clientDoc || null,
      clientAddress: clientAddress || null,
      clientPhone: clientPhone || null,
      clientEmail: clientEmail || null,
      eventDate: eventDate ? new Date(eventDate) : null,
      eventType: eventType || null,
      guestCount: guestCount ? parseInt(guestCount) : null,
      status: status || "rascunho",
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

  return NextResponse.json(quote, { status: 201 });
}
