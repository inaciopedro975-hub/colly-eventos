import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.event.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, clientName, clientPhone, clientEmail, date, timeStart, timeEnd, type, status, notes, value, guestCount } = body;

  if (!title || !clientName || !date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const eventDate = new Date(date);

  // Conflict check server-side
  const conflict = await prisma.event.findFirst({
    where: {
      date: {
        gte: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()),
        lt: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate() + 1),
      },
      status: { not: "cancelado" },
    },
  });

  if (conflict) {
    return NextResponse.json(
      { error: `Conflito de data: "${conflict.title}" já está marcado para este dia.` },
      { status: 409 }
    );
  }

  const event = await prisma.event.create({
    data: {
      title,
      clientName,
      clientPhone: clientPhone || null,
      clientEmail: clientEmail || null,
      date: eventDate,
      timeStart: timeStart || null,
      timeEnd: timeEnd || null,
      type: type || "casamento",
      status: status || "confirmado",
      notes: notes || null,
      value: value ?? null,
      guestCount: guestCount ?? null,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
