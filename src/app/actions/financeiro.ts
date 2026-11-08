"use server";

import { todayISODate } from "@/lib/dates";
import type { ContaTipo, MovimentoTipo } from "@/lib/finance";
import { getEstabelecimentoId, getProvisaoDiaria } from "@/lib/finance/data";
import { assertCents } from "@/lib/money";
import { createSupabaseClient } from "@/lib/supabase/client";
import { z } from "zod";

export interface SaveResult {
  ok: boolean;
  error?: string;
}

const uuidSchema = z.string().uuid();
const centsSchema = z.number().int().positive();

const err = (e: { message: string } | null): SaveResult =>
  e ? { ok: false, error: e.message } : { ok: true };

// --- Contas financeiras ------------------------------------------------------

export async function criarConta(input: {
  nome: string;
  tipo: ContaTipo;
  saldoInicialCentavos: number;
  dataSaldoInicial?: string;
}): Promise<SaveResult> {
  const schema = z.object({
    nome: z.string().min(1),
    tipo: z.enum(["CAIXA_FISICO", "MAQUININHA", "BANCO"]),
    saldoInicialCentavos: z.number().int().nonnegative(),
    dataSaldoInicial: z.string().optional(),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados de conta inválidos." };

  const supabase = await createSupabaseClient();
  const estabelecimentoId = await getEstabelecimentoId();
  if (!estabelecimentoId) return { ok: false, error: "Estabelecimento não encontrado." };

  const { error } = await supabase.from("contas_financeiras").insert({
    estabelecimento_id: estabelecimentoId,
    nome: parsed.data.nome,
    tipo: parsed.data.tipo,
    saldo_inicial_centavos: assertCents(parsed.data.saldoInicialCentavos),
    data_saldo_inicial: parsed.data.dataSaldoInicial ?? todayISODate(),
  });
  return err(error);
}

// --- Movimentações operacionais ----------------------------------------------

export async function registrarMovimento(input: {
  contaId: string;
  tipo: MovimentoTipo;
  valorCentavos: number;
  descricao?: string;
  dataReferencia?: string;
}): Promise<SaveResult> {
  const schema = z.object({
    contaId: uuidSchema,
    tipo: z.enum(["ENTRADA", "SAIDA"]),
    valorCentavos: centsSchema,
    descricao: z.string().optional(),
    dataReferencia: z.string().optional(),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados de movimentação inválidos." };

  const supabase = await createSupabaseClient();
  const estabelecimentoId = await getEstabelecimentoId();
  if (!estabelecimentoId) return { ok: false, error: "Estabelecimento não encontrado." };

  const { error } = await supabase.from("movimentacoes_financeiras").insert({
    estabelecimento_id: estabelecimentoId,
    conta_id: parsed.data.contaId,
    tipo: parsed.data.tipo,
    natureza: "OPERACIONAL",
    valor_centavos: assertCents(parsed.data.valorCentavos),
    data_referencia: parsed.data.dataReferencia ?? todayISODate(),
    descricao: parsed.data.descricao?.trim() || null,
  });
  return err(error);
}

// --- Transferências internas --------------------------------------------------

export async function criarTransferencia(input: {
  contaOrigemId: string;
  contaDestinoId: string;
  valorCentavos: number;
  descricao?: string;
}): Promise<SaveResult> {
  const schema = z.object({
    contaOrigemId: uuidSchema,
    contaDestinoId: uuidSchema,
    valorCentavos: centsSchema,
    descricao: z.string().optional(),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados de transferência inválidos." };

  const supabase = await createSupabaseClient();
  const estabelecimentoId = await getEstabelecimentoId();
  if (!estabelecimentoId) return { ok: false, error: "Estabelecimento não encontrado." };

  const { error } = await supabase.rpc("criar_transferencia", {
    p_estabelecimento_id: estabelecimentoId,
    p_conta_origem_id: parsed.data.contaOrigemId,
    p_conta_destino_id: parsed.data.contaDestinoId,
    p_valor_centavos: assertCents(parsed.data.valorCentavos),
    p_descricao: parsed.data.descricao?.trim() || undefined,
  });
  return err(error);
}

// --- Reservas -----------------------------------------------------------------

const reservaMovSchema = z.object({
  reservaId: uuidSchema,
  valorCentavos: centsSchema,
  descricao: z.string().optional(),
});

export async function aportarReserva(input: {
  reservaId: string;
  valorCentavos: number;
  descricao?: string;
}): Promise<SaveResult> {
  const parsed = reservaMovSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados de aporte inválidos." };
  const supabase = await createSupabaseClient();
  const estabelecimentoId = await getEstabelecimentoId();
  if (!estabelecimentoId) return { ok: false, error: "Estabelecimento não encontrado." };
  const { error } = await supabase.rpc("aportar_reserva", {
    p_estabelecimento_id: estabelecimentoId,
    p_reserva_id: parsed.data.reservaId,
    p_valor_centavos: assertCents(parsed.data.valorCentavos),
    p_descricao: parsed.data.descricao?.trim() || undefined,
  });
  return err(error);
}

export async function retirarReserva(input: {
  reservaId: string;
  valorCentavos: number;
  descricao?: string;
}): Promise<SaveResult> {
  const parsed = reservaMovSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados de retirada inválidos." };
  const supabase = await createSupabaseClient();
  const estabelecimentoId = await getEstabelecimentoId();
  if (!estabelecimentoId) return { ok: false, error: "Estabelecimento não encontrado." };
  const { error } = await supabase.rpc("retirar_reserva", {
    p_estabelecimento_id: estabelecimentoId,
    p_reserva_id: parsed.data.reservaId,
    p_valor_centavos: assertCents(parsed.data.valorCentavos),
    p_descricao: parsed.data.descricao?.trim() || undefined,
  });
  return err(error);
}

export async function transferirReservas(input: {
  reservaOrigemId: string;
  reservaDestinoId: string;
  valorCentavos: number;
  descricao?: string;
}): Promise<SaveResult> {
  const schema = z.object({
    reservaOrigemId: uuidSchema,
    reservaDestinoId: uuidSchema,
    valorCentavos: centsSchema,
    descricao: z.string().optional(),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados de transferência inválidos." };
  const supabase = await createSupabaseClient();
  const estabelecimentoId = await getEstabelecimentoId();
  if (!estabelecimentoId) return { ok: false, error: "Estabelecimento não encontrado." };
  const { error } = await supabase.rpc("transferir_entre_reservas", {
    p_estabelecimento_id: estabelecimentoId,
    p_reserva_origem_id: parsed.data.reservaOrigemId,
    p_reserva_destino_id: parsed.data.reservaDestinoId,
    p_valor_centavos: assertCents(parsed.data.valorCentavos),
    p_descricao: parsed.data.descricao?.trim() || undefined,
  });
  return err(error);
}

// --- Provisão diária ("quanto guardar hoje") ----------------------------------

/**
 * Executes today's suggestion: earmarks the recommended amount into the card
 * reserve and the other-bills reserve, in the split computed by
 * getProvisaoDiaria. Runs entirely server-side so the rules stay in one place.
 */
export async function guardarParaFixas(): Promise<SaveResult> {
  const provisao = await getProvisaoDiaria();
  if (!provisao) return { ok: false, error: "Posição financeira indisponível." };

  const { sugeridoCartao, sugeridoCompromissos, sugerido } = provisao.resultado;
  if (sugerido <= 0) return { ok: false, error: "Nada a guardar hoje." };

  const supabase = await createSupabaseClient();
  const estabelecimentoId = await getEstabelecimentoId();
  if (!estabelecimentoId) return { ok: false, error: "Estabelecimento não encontrado." };

  const aportes: { reservaId: string | null; valor: number; nome: string }[] = [
    { reservaId: provisao.reservaCartaoId, valor: sugeridoCartao, nome: "fatura" },
    {
      reservaId: provisao.reservaCompromissosId,
      valor: sugeridoCompromissos,
      nome: "demais contas",
    },
  ];

  for (const a of aportes) {
    if (a.valor <= 0) continue;
    if (!a.reservaId) return { ok: false, error: `Reserva de ${a.nome} não encontrada.` };
    const { error } = await supabase.rpc("aportar_reserva", {
      p_estabelecimento_id: estabelecimentoId,
      p_reserva_id: a.reservaId,
      p_valor_centavos: a.valor,
      p_descricao: "Provisão diária (contas fixas)",
    });
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}

// --- Fatura do cartão ---------------------------------------------------------

export async function pagarFatura(input: {
  faturaId: string;
  contaId: string;
  valorCentavos: number;
  descricao?: string;
}): Promise<SaveResult> {
  const schema = z.object({
    faturaId: uuidSchema,
    contaId: uuidSchema,
    valorCentavos: centsSchema,
    descricao: z.string().optional(),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados de pagamento inválidos." };
  const supabase = await createSupabaseClient();
  const estabelecimentoId = await getEstabelecimentoId();
  if (!estabelecimentoId) return { ok: false, error: "Estabelecimento não encontrado." };
  const { error } = await supabase.rpc("pagar_fatura", {
    p_estabelecimento_id: estabelecimentoId,
    p_fatura_id: parsed.data.faturaId,
    p_conta_id: parsed.data.contaId,
    p_valor_centavos: assertCents(parsed.data.valorCentavos),
    p_descricao: parsed.data.descricao?.trim() || undefined,
  });
  return err(error);
}
