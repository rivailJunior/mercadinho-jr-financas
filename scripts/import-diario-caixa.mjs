#!/usr/bin/env node
/*
 * One-time import of the "Diario Caixa" Google Sheet into lancamentos_caixa.
 *
 * - Parses the CSV (one row per day, real input = Faturamento do dia).
 * - Dedupes by business date, keeping the row with the LATEST Carimbo (submission
 *   timestamp). This resolves corrections and resubmissions.
 * - Skips days with no valid revenue (e.g. a blank/#VALUE! row).
 * - Inserts one ENTRADA per unique day, tagged origem = 'GOOGLE_SHEET'.
 * - Idempotent: before inserting, it deletes prior rows with origem='GOOGLE_SHEET'.
 *
 * Usage:
 *   node scripts/import-diario-caixa.mjs           # dry-run (no writes)
 *   node scripts/import-diario-caixa.mjs --write   # perform the import
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = resolve(HERE, "../data/diario-caixa.csv");

const URL = "https://vizyhhyugnufyijtwmyj.supabase.co";
const ANON_KEY = "sb_publishable_Qc3PUa9ZaP4uWhlo1Fu5Iw_ZeBoyFKy";
const WRITE = process.argv.includes("--write");

const ORIGEM = "GOOGLE_SHEET";
const CATEGORIA_ENTRADA = "Vendas Balcao (Dinheiro/Pix/Cartao)";

/* ---------- parsing helpers ---------- */

// "R$ 1.234,56" / "-R$ 71,87" / "70" / "66,66666667" -> number | null
function parseMoney(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (s === "" || s === "-" || /^#/.test(s)) return null; // blank or #VALUE!
  s = s.replace(/R\$\s?/g, "").replace(/\s/g, "").replace(/"/g, "");
  const neg = s.startsWith("-");
  if (neg) s = s.slice(1);
  s = s.replace(/\./g, "").replace(",", ".");
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

// "03/01/2026" or "03/01/2026 19:58:58" -> {dateIso, timeStr} | null
function parseDateTime(raw) {
  if (!raw) return null;
  const m = String(raw).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
  if (!m) return null;
  const [, dd, mm, yyyy, hh = "00", mi = "00", ss = "00"] = m;
  return { dateIso: `${yyyy}-${mm}-${dd}`, timeIso: `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}` };
}

function parseCsvLine(line) {
  // Minimal RFC-4180-ish split: honor double-quoted fields
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

/* ---------- load + dedupe ---------- */

const lines = readFileSync(CSV_PATH, "utf8")
  .split(/\r?\n/)
  .filter((l) => l.trim() !== "");

const dataLines = lines.slice(1); // drop header

const byDate = new Map(); // dateIso -> {dateIso, revenue, carimbo}
let skippedBlank = 0;
let skippedBad = 0;

for (const line of dataLines) {
  const cols = parseCsvLine(line);
  const carimbo = parseDateTime(cols[0]);
  const data = parseDateTime(cols[1]);
  const revenue = parseMoney(cols[2]);

  if (!data) { skippedBad++; continue; }
  if (revenue == null) { skippedBlank++; continue; }

  const prev = byDate.get(data.dateIso);
  // keep the row with the latest submission timestamp
  if (!prev || (carimbo && carimbo.timeIso > (prev.carimboTime || ""))) {
    byDate.set(data.dateIso, {
      dateIso: data.dateIso,
      revenue,
      carimboTime: carimbo ? carimbo.timeIso : "",
    });
  }
}

const rows = [...byDate.values()].sort((a, b) => a.dateIso.localeCompare(b.dateIso));

console.log(`Parsed ${dataLines.length} data rows`);
console.log(`Unique business days (after dedupe): ${rows.length}`);
console.log(`Skipped (no valid revenue): ${skippedBlank} | unparseable: ${skippedBad}`);
const total = rows.reduce((s, r) => s + r.revenue, 0);
console.log(`Date range: ${rows[0]?.dateIso} -> ${rows[rows.length - 1]?.dateIso}`);
console.log(`Total revenue across period: R$ ${total.toFixed(2)}`);
console.log(`Min/Max day: R$ ${Math.min(...rows.map(r => r.revenue)).toFixed(2)} / R$ ${Math.max(...rows.map(r => r.revenue)).toFixed(2)}`);

// show a couple dedupe decisions for sanity
console.log(`Sample: 2026-03-25 => R$ ${byDate.get("2026-03-25")?.revenue}`);
console.log(`Sample: 2026-06-01 => R$ ${byDate.get("2026-06-01")?.revenue} (blank day refilled)`);
console.log(`Sample: 2026-10-26 => R$ ${byDate.get("2026-10-26")?.revenue} (correction 3069 -> 2171)`);

/* ---------- write ---------- */

if (!WRITE) {
  console.log("\nDRY RUN — no rows written. Re-run with --write to import.");
  process.exit(0);
}

const supabase = createClient(URL, ANON_KEY);

const { data: est, error: estErr } = await supabase
  .from("estabelecimentos").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
if (estErr || !est) { console.error("No estabelecimento found:", estErr); process.exit(1); }

const { data: cat } = await supabase
  .from("categorias").select("id").eq("nome", CATEGORIA_ENTRADA).maybeSingle();

// idempotency: clear previously imported rows
const { error: delErr, count: delCount } = await supabase
  .from("lancamentos_caixa").delete({ count: "exact" }).eq("origem", ORIGEM);
if (delErr) { console.error("Failed clearing prior imports:", delErr); process.exit(1); }
console.log(`\nCleared ${delCount ?? 0} prior '${ORIGEM}' rows.`);

const payload = rows.map((r) => ({
  estabelecimento_id: est.id,
  categoria_id: cat?.id ?? null,
  data_referencia: r.dateIso,
  tipo: "ENTRADA",
  valor: r.revenue,
  origem: ORIGEM,
  sincronizado_sheets: true,
  descricao: "Faturamento do dia (importado da planilha)",
}));

const CHUNK = 100;
let inserted = 0;
for (let i = 0; i < payload.length; i += CHUNK) {
  const slice = payload.slice(i, i + CHUNK);
  const { error } = await supabase.from("lancamentos_caixa").insert(slice);
  if (error) { console.error(`Insert failed at chunk ${i}:`, error); process.exit(1); }
  inserted += slice.length;
}
console.log(`Inserted ${inserted} ENTRADA rows into lancamentos_caixa.`);
