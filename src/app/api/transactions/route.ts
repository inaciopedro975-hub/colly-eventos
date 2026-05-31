import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const month = searchParams.get("month");

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (month) {
    const [year, m] = month.split("-").map(Number);
    where.date = { gte: new Date(year, m - 1, 1), lt: new Date(year, m, 1) };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    type, category, description, amount,
    date, status, paymentMethod, notes,
    quoteId, eventId,
    installments, // número de parcelas (1 = sem parcelamento)
  } = body;

  if (!type || !description || amount === undefined || !date) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const numInstallments = parseInt(installments ?? "1") || 1;
  const baseAmount = parseFloat(amount) / numInstallments;
  const baseDate = new Date(date);

  if (numInstallments <= 1) {
    // Transação única
    const transaction = await prisma.transaction.create({
      data: {
        type,
        category: category || "outros",
        description,
        amount: parseFloat(amount),
        date: baseDate,
        status: status || "recebido",
        paymentMethod: paymentMethod || null,
        notes: notes || null,
        quoteId: quoteId ? parseInt(quoteId) : null,
        eventId: eventId || null,
      },
    });
    return NextResponse.json(transaction, { status: 201 });
  }

  // Parcelamento — cria N transações com um grupo compartilhado
  const groupId = `grp_${Date.now()}`;
  const created = [];

  for (let i = 0; i < numInstallments; i++) {
    const installDate = new Date(baseDate);
    installDate.setMonth(installDate.getMonth() + i);

    const t = await prisma.transaction.create({
      data: {
        type,
        category: category || "outros",
        description: `${description} (${i + 1}/${numInstallments})`,
        amount: parseFloat(baseAmount.toFixed(2)),
        date: installDate,
        status: "pendente", // todas começam como pendentes
        paymentMethod: paymentMethod || null,
        notes: notes || null,
        installmentGroup: groupId,
        installmentNum: i + 1,
        totalInstallments: numInstallments,
        quoteId: quoteId ? parseInt(quoteId) : null,
        eventId: eventId || null,
      },
    });
    created.push(t);
  }

  return NextResponse.json(created, { status: 201 });
}
