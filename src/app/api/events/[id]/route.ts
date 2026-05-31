import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, clientName, clientPhone, clientEmail, date, timeStart, timeEnd, type, status, notes, value, guestCount } = body;

  const eventDate = new Date(date);

  // Conflict check excluding this event
  const conflict = await prisma.event.findFirst({
    where: {
      id: { not: id },
      date: {
        gte: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()),
        lt: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate() + 1),
      },
      status: { not: "cancelado" },
    },
  });

  if (conflict) {
    return NextResponse.json(
      { error: `Conflito: "${conflict.title}" já está nesta data.` },
      { status: 409 }
    );
  }

  const updated = await prisma.event.update({
    where: { id },
    data: {
      title,
      clientName,
      clientPhone: clientPhone || null,
      clientEmail: clientEmail || null,
      date: eventDate,
      timeStart: timeStart || null,
      timeEnd: timeEnd || null,
      type,
      status,
      notes: notes || null,
      value: value ?? null,
      guestCount: guestCount ?? null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
