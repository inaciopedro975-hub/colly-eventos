// ───────────────────────────────────────────────────────────────
//  Aplica TODAS as migrations do Prisma no banco Turso, em ordem.
//  Seguro rodar mais de uma vez (não reaplica o que já foi feito).
//
//  Como usar:
//    1. Preencha DATABASE_URL e TURSO_AUTH_TOKEN no .env.production
//       (ou exporte como variáveis de ambiente).
//    2. Rode:  node scripts/migrate-turso.mjs
// ───────────────────────────────────────────────────────────────
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@libsql/client";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Carrega .env.production se existir (sem sobrescrever env já definida)
const envFile = join(root, ".env.production");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !url.startsWith("libsql://")) {
  console.error("❌ DATABASE_URL precisa ser uma URL do Turso (libsql://...).");
  console.error("   Configure no .env.production ou exporte a variável antes de rodar.");
  process.exit(1);
}
if (!authToken) {
  console.error("❌ TURSO_AUTH_TOKEN não definido. Gere com: turso db tokens create <seu-banco>");
  process.exit(1);
}

const client = createClient({ url, authToken });

const migrationsDir = join(root, "prisma", "migrations");
const dirs = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort(); // ordem cronológica (prefixo de data)

console.log(`\n🔗 Conectado ao Turso: ${url}`);
console.log(`📂 ${dirs.length} migrations encontradas\n`);

// Tabela de controle (idempotência)
await client.executeMultiple(`
  CREATE TABLE IF NOT EXISTS _turso_migrations_applied (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const appliedRes = await client.execute("SELECT name FROM _turso_migrations_applied");
const applied = new Set(appliedRes.rows.map((r) => r.name));

let count = 0;
for (const name of dirs) {
  if (applied.has(name)) {
    console.log(`⏭️  ${name} — já aplicada, pulando`);
    continue;
  }
  const sqlPath = join(migrationsDir, name, "migration.sql");
  if (!existsSync(sqlPath)) {
    console.log(`⚠️  ${name} — sem migration.sql, pulando`);
    continue;
  }
  const sql = readFileSync(sqlPath, "utf8");
  try {
    await client.executeMultiple(sql);
    await client.execute({
      sql: "INSERT INTO _turso_migrations_applied (name) VALUES (?)",
      args: [name],
    });
    count++;
    console.log(`✅ ${name} — aplicada`);
  } catch (err) {
    console.error(`\n❌ Erro na migration ${name}:`);
    console.error(`   ${err.message}\n`);
    console.error("   Corrija e rode de novo (as anteriores já ficaram registradas).");
    process.exit(1);
  }
}

// Verificação final: lista as tabelas criadas
const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_turso_%' ORDER BY name"
);
console.log(`\n🎉 Concluído! ${count} nova(s) migration(s) aplicada(s).`);
console.log(`📋 Tabelas no banco: ${tables.rows.map((r) => r.name).join(", ")}`);
console.log("\nPróximo passo: criar o admin com  npm run seed  (com o mesmo DATABASE_URL do Turso).\n");

process.exit(0);
