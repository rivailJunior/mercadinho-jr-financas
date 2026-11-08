#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
/*
 * Initial financial-management setup (one-time).
 *
 * Creates the financial accounts, the logical reserves and the reference
 * commitments for the store — WITHOUT inventing how the existing R$ 12.213 is
 * physically split between accounts. The real per-account balances are passed
 * in as arguments, so the consolidated total always matches reality.
 *
 * Values are provided in REAIS on the command line and converted to integer
 * cents before being written.
 *
 * Usage (loads .env automatically):
 *   node scripts/seed-financial-setup.mjs \
 *     --caixa 5000 --maquininha 7213 \
 *     [--caixa-minimo 2500] [--fatura-fechamento 2026-01-10] [--fatura-vencimento 2026-01-20] \
 *     [--write]
 *
 * Without --write it only prints what would be created (dry-run).
 */
import { createClient } from "@supabase/supabase-js";

const HERE = dirname(fileURLToPath(import.meta.url));

/* ---------- env ---------- */
const env = Object.fromEntries(
  readFileSync(resolve(HERE, "../.env"), "utf8")
    .split(/\r?\n/)
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/i))
    .filter(Boolean)
    .map(([, k, v]) => [k, v]),
);
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

/* ---------- args ---------- */
// Supports both `--key value` and `--key=value`. Bare `--flag` means boolean true.
const args = {};
{
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const m = argv[i].match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    if (m[2] !== undefined) {
      args[m[1]] = m[2];
    } else if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      args[m[1]] = argv[++i];
    } else {
      args[m[1]] = true;
    }
  }
}
const WRITE = args.write === true;
const reais = (name) => (args[name] == null ? null : Math.round(Number(args[name]) * 100));
const caixa = reais("caixa");
const maquininha = reais("maquininha");
const caixaMinimo = reais("caixa-minimo") ?? 0;

if (caixa == null || maquininha == null) {
  console.error("Passe os saldos reais: --caixa <reais> --maquininha <reais>");
  process.exit(1);
}

/* ---------- reference data ---------- */
// Reservas lógicas confirmadas (centavos). Não é dinheiro novo — é a destinação
// de dinheiro que já existe no caixa.
const RESERVAS = [
  {
    nome: "Fatura do cartão",
    finalidade: "Cobrir a fatura mensal do cartão",
    valor_atual_centavos: 1000000,
    meta_centavos: 2000000,
    prioridade: 1,
  },
  {
    nome: "Demais compromissos",
    finalidade: "Contas fixas e obrigações mensais",
    valor_atual_centavos: 221300,
    meta_centavos: null,
    prioridade: 2,
  },
  {
    nome: "Emergência",
    finalidade: "Imprevistos operacionais",
    valor_atual_centavos: 0,
    meta_centavos: null,
    prioridade: 8,
  },
  {
    nome: "Investimentos",
    finalidade: "Sobra real disponível para investir",
    valor_atual_centavos: 0,
    meta_centavos: null,
    prioridade: 9,
  },
];

// Compromissos mensais de referência (valores configuráveis, não dívida).
// dia_vencimento: dia do mês em que a conta vence (null = último dia do mês).
const COMPROMISSOS = [
  { nome: "Pró-labore", valor_previsto_centavos: 200000, prioridade: 3, dia_vencimento: null },
  { nome: "Água", valor_previsto_centavos: 50000, prioridade: 4, dia_vencimento: 24 },
  {
    nome: "Energia elétrica",
    valor_previsto_centavos: 90000,
    prioridade: 4,
    dia_vencimento: 6,
  },
  { nome: "Funcionários", valor_previsto_centavos: 220000, prioridade: 5, dia_vencimento: null },
];

const contas = [
  { nome: "Caixa físico", tipo: "CAIXA_FISICO", saldo_inicial_centavos: caixa },
  { nome: "Maquininha", tipo: "MAQUININHA", saldo_inicial_centavos: maquininha },
];

const total = caixa + maquininha;
const reservado = RESERVAS.reduce((a, r) => a + r.valor_atual_centavos, 0);

console.log("=== Configuração inicial (dry-run) ===");
console.log(
  `Contas: Caixa físico R$ ${(caixa / 100).toFixed(2)} | Maquininha R$ ${(maquininha / 100).toFixed(2)}`,
);
console.log(`Consolidado: R$ ${(total / 100).toFixed(2)}`);
console.log(`Reservado:  R$ ${(reservado / 100).toFixed(2)}`);
console.log(`Saldo livre: R$ ${((total - reservado) / 100).toFixed(2)}`);
if (reservado > total) {
  console.warn("AVISO: reservado maior que o consolidado — revise os saldos informados.");
}
if (!WRITE) {
  console.log("\nDRY RUN — re-execute com --write para gravar.");
  process.exit(0);
}

const supabase = createClient(URL, KEY);
// RLS is restrictive: writes must run as a linked member. Provide the
// credentials through env vars (or .env): SUPABASE_USER_EMAIL / SUPABASE_USER_PASSWORD.
const { error: authErr } = await supabase.auth.signInWithPassword({
  email: env.SUPABASE_USER_EMAIL ?? "",
  password: env.SUPABASE_USER_PASSWORD ?? "",
});
if (authErr) {
  console.error(
    "Login falhou. Defina SUPABASE_USER_EMAIL e SUPABASE_USER_PASSWORD no .env.",
    authErr.message,
  );
  process.exit(1);
}
const { data: est, error: estErr } = await supabase
  .from("estabelecimentos")
  .select("id")
  .order("created_at", { ascending: true })
  .limit(1)
  .maybeSingle();
if (estErr || !est) {
  console.error("Estabelecimento não encontrado:", estErr);
  process.exit(1);
}
const estId = est.id;

const hoje = new Date().toISOString().slice(0, 10);

// Each step is idempotent: it only inserts when nothing exists yet, so a
// partial previous run can be completed safely by re-running this script.
const countOf = async (table) => {
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("estabelecimento_id", estId)
    .is("deleted_at", null);
  return count ?? 0;
};

let reservasInsert;
if ((await countOf("contas_financeiras")) === 0) {
  const { error: cErr } = await supabase
    .from("contas_financeiras")
    .insert(contas.map((c) => ({ ...c, estabelecimento_id: estId, data_saldo_inicial: hoje })));
  if (cErr) {
    console.error("Erro criando contas:", cErr);
    process.exit(1);
  }
  console.log(`Criadas ${contas.length} contas.`);
} else {
  console.log("Contas já existem — pulando.");
}

if ((await countOf("reservas_financeiras")) === 0) {
  const { data, error: rErr } = await supabase
    .from("reservas_financeiras")
    .insert(RESERVAS.map((r) => ({ ...r, estabelecimento_id: estId })))
    .select("id, nome");
  if (rErr) {
    console.error("Erro criando reservas:", rErr);
    process.exit(1);
  }
  reservasInsert = data;
  console.log(`Criadas ${reservasInsert.length} reservas.`);
} else {
  const { data } = await supabase
    .from("reservas_financeiras")
    .select("id, nome")
    .eq("estabelecimento_id", estId)
    .is("deleted_at", null);
  reservasInsert = data ?? [];
  console.log("Reservas já existem — pulando.");
}

if ((await countOf("compromissos_financeiros")) === 0) {
  const reservaCompromissos = reservasInsert.find((r) => r.nome === "Demais compromissos");
  const { error: kErr } = await supabase.from("compromissos_financeiros").insert(
    COMPROMISSOS.map((k) => ({
      ...k,
      estabelecimento_id: estId,
      periodicidade: "MENSAL",
      reserva_id: reservaCompromissos?.id ?? null,
      status: "PENDENTE",
    })),
  );
  if (kErr) {
    console.error("Erro criando compromissos:", kErr);
    process.exit(1);
  }
  console.log(`Criados ${COMPROMISSOS.length} compromissos.`);
} else {
  console.log("Compromissos já existem — pulando.");
}

// Config: caixa mínimo operacional.
if (caixaMinimo > 0) {
  const { error: cfgErr } = await supabase
    .from("config_financeira")
    .update({ caixa_minimo_centavos: caixaMinimo })
    .eq("estabelecimento_id", estId);
  if (cfgErr) console.warn("Não foi possível definir caixa mínimo:", cfgErr.message);
  else console.log(`Caixa mínimo: R$ ${(caixaMinimo / 100).toFixed(2)}`);
}

// Fatura inicial do ciclo atual, se datas informadas.
if (args["fatura-fechamento"] && args["fatura-vencimento"]) {
  const reservaCartao = reservasInsert.find((r) => r.nome === "Fatura do cartão");
  const { error: fErr } = await supabase.from("faturas_cartao").insert({
    estabelecimento_id: estId,
    reserva_id: reservaCartao?.id ?? null,
    fechamento: args["fatura-fechamento"],
    vencimento: args["fatura-vencimento"],
    valor_reservado_centavos: reservaCartao ? 1000000 : 0,
    status: "ABERTA",
  });
  if (fErr) console.warn("Não foi possível criar a fatura inicial:", fErr.message);
  else console.log("Fatura inicial do ciclo criada.");
}

console.log("\nConfiguração inicial concluída.");
