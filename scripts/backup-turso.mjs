// ───────────────────────────────────────────────────────────────
//  BACKUP do banco (Turso ou local) — SOMENTE LEITURA.
//  Este script nunca escreve, altera ou apaga nada no banco.
//
//  Gera dois arquivos dentro de /backups:
//    backup-AAAA-MM-DD_HHMM.json  → todos os dados, fácil de ler
//    backup-AAAA-MM-DD_HHMM.sql   → INSERTs prontos para restaurar
//
//  Como usar:
//    npm run db:backup              → banco de PRODUÇÃO (Turso, do .env.production)
//    npm run db:backup -- --local   → banco local dev.db
//
//  A pasta /backups é ignorada pelo git (contém CPF/RG de clientes).
// ───────────────────────────────────────────────────────────────
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@libsql/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const usarLocal = process.argv.includes("--local");

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

// Produção vem do .env.production; variáveis de ambiente já exportadas têm prioridade
const prod = lerEnv(join(root, ".env.production"));
const url = process.env.DATABASE_URL_BACKUP || prod.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN || prod.TURSO_AUTH_TOKEN;

let client;
let origem;
if (usarLocal) {
  const local = resolve(root, "dev.db");
  if (!existsSync(local)) {
    console.error(`❌ Banco local não encontrado em ${local}.`);
    process.exit(1);
  }
  client = createClient({ url: `file:${local}` });
  origem = `LOCAL — ${local}`;
} else {
  if (!url || !url.startsWith("libsql://")) {
    console.error("❌ DATABASE_URL do .env.production não é uma URL do Turso (libsql://...).");
    console.error("   Para fazer backup do banco local, rode:  npm run db:backup -- --local");
    process.exit(1);
  }
  if (!authToken) {
    console.error("❌ TURSO_AUTH_TOKEN não definido no .env.production — não dá para ler o banco de produção.");
    process.exit(1);
  }
  client = createClient({ url, authToken });
  origem = `PRODUÇÃO — ${url}`;
}

console.log(`\n🔗 Lendo de ${origem}`);
console.log("🔒 Modo somente leitura — nada será alterado.\n");

// Descobre as tabelas de dados (ignora as internas do sqlite/turso/prisma)
let tabelas;
try {
  tabelas = (
    await client.execute(
      `SELECT name FROM sqlite_master
        WHERE type='table'
          AND name NOT LIKE 'sqlite_%'
          AND name NOT LIKE '_turso_%'
          AND name NOT LIKE '_prisma_%'
        ORDER BY name`
    )
  ).rows.map((r) => r.name);
} catch (err) {
  console.error(`❌ Não consegui conectar no banco.\n   ${err.message}\n`);
  if (String(url).includes("SEU-BANCO")) {
    console.error("   O DATABASE_URL do .env.production ainda é o texto de exemplo");
    console.error('   ("libsql://SEU-BANCO.turso.io"). Coloque a URL e o token reais do');
    console.error("   seu banco de produção — eles estão nas variáveis de ambiente do");
    console.error("   painel da Hostinger. O .env.production é ignorado pelo git.\n");
  } else {
    console.error("   Confira a URL e o TURSO_AUTH_TOKEN no .env.production.\n");
  }
  process.exit(1);
}

if (tabelas.length === 0) {
  console.error("❌ Nenhuma tabela encontrada. Confira se o DATABASE_URL aponta para o banco certo.");
  process.exit(1);
}

// Converte valores do libsql para algo que o JSON aguenta
function paraJson(v) {
  if (typeof v === "bigint") return Number(v);
  if (v instanceof Uint8Array) return { __blob__: Buffer.from(v).toString("base64") };
  return v;
}

// Converte valores para literal SQL
function paraSql(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "1" : "0";
  if (v instanceof Uint8Array) return `X'${Buffer.from(v).toString("hex")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

const dump = {};
const linhasSql = [
  "-- Backup Colly Eventos",
  `-- Origem: ${origem}`,
  `-- Gerado em: ${new Date().toISOString()}`,
  "-- Para restaurar: rode estes INSERTs no banco (as tabelas já devem existir).",
  "",
];

let totalLinhas = 0;
for (const tabela of tabelas) {
  const res = await client.execute(`SELECT * FROM "${tabela}"`);
  const colunas = res.columns;
  const linhas = res.rows.map((r) => Object.fromEntries(colunas.map((c) => [c, paraJson(r[c])])));

  dump[tabela] = linhas;
  totalLinhas += linhas.length;

  linhasSql.push(`-- ${tabela} (${res.rows.length} registro(s))`);
  for (const r of res.rows) {
    const cols = colunas.map((c) => `"${c}"`).join(", ");
    const vals = colunas.map((c) => paraSql(r[c])).join(", ");
    linhasSql.push(`INSERT INTO "${tabela}" (${cols}) VALUES (${vals});`);
  }
  linhasSql.push("");

  console.log(`📦 ${tabela.padEnd(14)} ${String(res.rows.length).padStart(5)} registro(s)`);
}

// Estado das migrations, se a tabela de controle existir (ajuda a conferir antes do deploy)
try {
  const mig = await client.execute("SELECT name FROM _turso_migrations_applied ORDER BY name");
  dump.__migrations_aplicadas__ = mig.rows.map((r) => r.name);
  console.log(`\n🗂️  Migrations já aplicadas neste banco: ${mig.rows.length}`);
  for (const r of mig.rows) console.log(`   • ${r.name}`);
} catch {
  console.log("\n⚠️  Tabela de controle _turso_migrations_applied não existe neste banco.");
  console.log("   O 'npm run db:turso' tentaria aplicar TODAS as migrations do zero.");
  console.log("   Guarde este backup antes de rodá-lo.");
}

const pasta = join(root, "backups");
if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true });

const agora = new Date();
const carimbo =
  `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}` +
  `_${String(agora.getHours()).padStart(2, "0")}${String(agora.getMinutes()).padStart(2, "0")}`;

const arquivoJson = join(pasta, `backup-${carimbo}.json`);
const arquivoSql = join(pasta, `backup-${carimbo}.sql`);

writeFileSync(arquivoJson, JSON.stringify(dump, null, 2), "utf8");
writeFileSync(arquivoSql, linhasSql.join("\n"), "utf8");

console.log(`\n✅ Backup concluído — ${totalLinhas} registro(s) no total.`);
console.log(`   ${arquivoJson}`);
console.log(`   ${arquivoSql}`);
console.log("\n⚠️  Esses arquivos contêm dados de clientes (CPF/RG). Não envie para o GitHub nem para terceiros.\n");

process.exit(0);
