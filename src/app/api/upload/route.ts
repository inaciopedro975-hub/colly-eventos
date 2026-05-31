import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // Validar tipo de ficheiro
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de ficheiro nao permitido. Use JPG, PNG ou WebP." }, { status: 400 });
  }

  // Validar tamanho (max 5MB)
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: "Ficheiro muito grande. Maximo 5MB." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Usar extensao baseada no MIME type, nao no nome do ficheiro
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const ext = extMap[file.type] ?? "jpg";
  const filename = `${Date.now()}.${ext}`;
  const dir = join(process.cwd(), "public", "uploads", "products");

  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), buffer);

  return NextResponse.json({ url: `/uploads/products/${filename}` });
}
