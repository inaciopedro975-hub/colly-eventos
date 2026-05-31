import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";
import { resolve } from "path";

const dbUrl = process.env.DATABASE_URL;
let adapter;
if (dbUrl && dbUrl.startsWith("libsql://")) {
  adapter = new PrismaLibSql({ url: dbUrl, authToken: process.env.TURSO_AUTH_TOKEN });
} else {
  const dbPath = resolve(process.cwd(), "dev.db");
  adapter = new PrismaLibSql({ url: `file:${dbPath}` });
}
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("colly@2024", 10);

  const adminExists = await prisma.user.findUnique({ where: { email: "admin@collyeventos.com.br" } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        name: "Administrador",
        email: "admin@collyeventos.com.br",
        password,
        role: "admin",
      },
    });
    console.log("Admin criado: admin@collyeventos.com.br");
  } else {
    console.log("Admin ja existe, pulando.");
  }

  const lucineiaExists = await prisma.user.findUnique({ where: { email: "lucineia996729770@gmail.com" } });
  if (!lucineiaExists) {
    await prisma.user.create({
      data: {
        name: "Lucineia",
        email: "lucineia996729770@gmail.com",
        password,
        role: "user",
      },
    });
    console.log("Lucineia criada: lucineia996729770@gmail.com");
  } else {
    console.log("Lucineia ja existe, pulando.");
  }

  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await prisma.product.createMany({
      data: [
        { name: "Buffet completo (por pessoa)", description: "Inclui entrada, prato principal, sobremesa e bebidas nao alcoolicas", price: 120, unit: "pessoa", category: "buffet" },
        { name: "Buffet simples (por pessoa)", description: "Prato principal e bebidas nao alcoolicas", price: 75, unit: "pessoa", category: "buffet" },
        { name: "Bolo de casamento (por fatia)", description: "Bolo personalizado, por fatia servida", price: 18, unit: "porcao", category: "confeitaria" },
        { name: "Mesa de doces premium", description: "Mesa decorada com doces finos variados", price: 2800, unit: "un", category: "confeitaria" },
        { name: "Decoracao basica", description: "Arranjos de mesa, toalhas e centro de mesa", price: 1500, unit: "un", category: "decoracao" },
        { name: "Decoracao premium", description: "Decoracao completa com flores naturais", price: 4500, unit: "un", category: "decoracao" },
        { name: "DJ por hora", description: "DJ profissional com equipamento de som", price: 350, unit: "hora", category: "musica" },
        { name: "Banda ao vivo (4h)", description: "Banda de 5 integrantes, repertorio variado", price: 3200, unit: "un", category: "musica" },
        { name: "Garcom (por hora)", description: "Garcom treinado para eventos", price: 80, unit: "hora", category: "servico" },
        { name: "Barman (por hora)", description: "Barman com equipamento de bar", price: 120, unit: "hora", category: "servico" },
      ],
    });
    console.log("Produtos de exemplo criados.");
  }

  console.log("Seed concluido!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
