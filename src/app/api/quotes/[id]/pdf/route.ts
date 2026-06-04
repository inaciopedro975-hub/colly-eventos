import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuotePDF } from "@/lib/quote-pdf";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const quote = await prisma.quote.findUnique({
    where: { id: numId },
    include: { items: { include: { product: true } } },
  });

  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const subtotal = quote.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  // Carregar logo real ou usar fallback vazio
  const logoPath = join(process.cwd(), "public", "logo.png");
  const logoSrc = existsSync(logoPath)
    ? `data:image/png;base64,${readFileSync(logoPath).toString("base64")}`
    : "";

  const pdfData = {
    number: quote.id,
    createdAt: quote.createdAt,
    clientName: quote.clientName,
    clientDoc: quote.clientDoc,
    clientAddress: quote.clientAddress,
    clientPhone: quote.clientPhone,
    clientEmail: quote.clientEmail,
    items: quote.items.map((item) => ({
      productName: item.product.name,
      productUnit: item.product.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      listPrice: item.product.price,
      total: item.total,
      notes: item.notes,
    })),
    notes: quote.notes,
    paymentTerms: quote.paymentTerms,
    validity: quote.validity,
    subtotal,
    discount: quote.discount,
    total: quote.total,
    logoSrc,
  };

  const buffer = await renderToBuffer(QuotePDF({ data: pdfData }));
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="orcamento-${String(quote.id).padStart(4, "0")}-${quote.clientName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`,
    },
  });
}
