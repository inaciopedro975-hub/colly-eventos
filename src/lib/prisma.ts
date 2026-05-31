import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../generated/prisma/client";
import { resolve } from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL;

  let adapter;
  if (dbUrl && dbUrl.startsWith("libsql://")) {
    // Base de dados remota Turso
    adapter = new PrismaLibSql({
      url: dbUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  } else {
    // Ficheiro SQLite local (desenvolvimento)
    const localUrl = dbUrl?.startsWith("file:")
      ? `file:${resolve(process.cwd(), dbUrl.slice(5))}`
      : `file:${resolve(process.cwd(), "dev.db")}`;
    adapter = new PrismaLibSql({ url: localUrl });
  }

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
