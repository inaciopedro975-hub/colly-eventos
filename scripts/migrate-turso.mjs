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

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Lê um arquivo .env sem mexer no process.env
function lerEnv(arquivo) {
  const vars = {};
  if (!existsSync(arquivo)) return vars;
  for (const line of readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m) vars[m[1]] = m[2];
  }
  return vars;
}

// Este script é só para produção: o .env.production manda, e não o .env local
// (que aponta para o dev.db). Variáveis já exportadas no shell têm prioridade.
const prod = lerEnv(join(root, ".env.production"));
const url = process.env.DATABASE_URL_PROD || prod.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN || prod.TURSO_AUTH_TOKEN;

if (!url || !url.startsWith("libsql://")) {
  console.error("❌ DATABASE_URL precisa ser uma URL do Turso (libsql://...).");
  console.error("   Preencha DATABASE_URL e TURSO_AUTH_TOKEN no .env.production");
  console.error("   com os valores reais do painel da Hostinger.");
  if (String(url).includes("SEU-BANCO")) {
    console.error('   (o valor atual, "libsql://SEU-BANCO.turso.io", é só um exemplo)');
  }
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

console.log(`\n🔗 Turso: ${url}`);
console.log(`📂 ${dirs.length} migrations encontradas\n`);

// Testa a conexão antes de qualquer escrita, para não falhar no meio do caminho
try {
  await client.execute("SELECT 1");
} catch (err) {
  console.error(`❌ Não consegui conectar no banco de produção.\n   ${err.message}\n`);
  if (String(url).includes("SEU-BANCO")) {
    console.error("   O DATABASE_URL do .env.production ainda é o texto de exemplo.");
    console.error("   Pegue a URL e o token reais nas variáveis de ambiente do painel");
    console.error("   da Hostinger e cole no .env.production (ele é ignorado pelo git).\n");
  } else {
    console.error("   Confira a URL e o TURSO_AUTH_TOKEN no .env.production.\n");
  }
  process.exit(1);
}

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
