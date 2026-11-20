"use server";

import { todayISODate } from "@/lib/dates";
import { reaisToCents } from "@/lib/money";
import { createSupabaseClient } from "@/lib/supabase/client";
import { z } from "zod";

const CATEGORIA_ENTRADA = "Vendas Balcao (Dinheiro/Pix/Cartao)";
const CATEGORIA_SAIDA = "Despesa Operacional Avulsa";

export interface SaveResult {
  ok: boolean;
  error?: string;
}

/** Resolves the default establishment id (single-store app). */
const getEstabelecimentoId = async (
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
): Promise<string | null> => {
  const { data } = await supabase
    .from("estabelecimentos")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
};

/** Resolves a categoria id by name, falling back to null when absent. */
const getCategoriaId = async (
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  nome: string,
): Promise<number | null> => {
  const { data } = await supabase
    .from("categorias")
    .select("id")
    .eq("nome", nome)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
};

const contaSchema = z.enum(["CAIXA_FISICO", "MAQUININHA"]);

/** Resolves the financial account id for the given account type. */
const getContaId = async (
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  estabelecimentoId: string,
  tipo: z.infer<typeof contaSchema>,
): Promise<string | null> => {
  const { data } = await supabase
    .from("contas_financeiras")
    .select("id")
    .eq("estabelecimento_id", estabelecimentoId)
    .eq("tipo", tipo)
    .eq("ativo", true)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
};

const entradaSchema = z.object({
  total: z.number().positive(),
  conta: contaSchema,
  formaPagamento: z.string().min(1).optional(),
  dataReferencia: z.string().optional(),
});

export async function saveEntrada(input: {
  total: number;
  conta: "CAIXA_FISICO" | "MAQUININHA";
  formaPagamento?: string;
  dataReferencia?: string;
}): Promise<SaveResult> {
  const parsed = entradaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Valor de entrada invalido." };
  }

  const supabase = await createSupabaseClient();
  const [estabelecimentoId, categoriaId] = await Promise.all([
    getEstabelecimentoId(supabase),
    getCategoriaId(supabase, CATEGORIA_ENTRADA),
  ]);
  if (!estabelecimentoId) return { ok: false, error: "Estabelecimento não encontrado." };

  const contaId = await getContaId(supabase, estabelecimentoId, parsed.data.conta);
  if (!contaId) return { ok: false, error: "Conta financeira não encontrada." };

  const { error } = await supabase.from("movimentacoes_financeiras").insert({
    estabelecimento_id: estabelecimentoId,
    conta_id: contaId,
    categoria_id: categoriaId,
    tipo: "ENTRADA",
    natureza: "OPERACIONAL",
    valor_centavos: reaisToCents(parsed.data.total),
    data_referencia: parsed.data.dataReferencia ?? todayISODate(),
    forma_pagamento: parsed.data.formaPagamento ?? "MISTO",
    descricao:
      parsed.data.conta === "MAQUININHA"
        ? "Entrada do dia (maquininha/Pix)"
        : "Entrada do dia (dinheiro)",
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

const saidaSchema = z.object({
  valor: z.number().positive(),
  descricao: z.string().optional(),
  conta: contaSchema,
  dataReferencia: z.string().optional(),
});

export async function saveSaida(input: {
  valor: number;
  descricao?: string;
  conta: "CAIXA_FISICO" | "MAQUININHA";
  dataReferencia?: string;
}): Promise<SaveResult> {
  const parsed = saidaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Valor ou descricao de saida invalido." };
  }

  const supabase = await createSupabaseClient();
  const [estabelecimentoId, categoriaId] = await Promise.all([
    getEstabelecimentoId(supabase),
    getCategoriaId(supabase, CATEGORIA_SAIDA),
  ]);
  if (!estabelecimentoId) return { ok: false, error: "Estabelecimento não encontrado." };

  const contaId = await getContaId(supabase, estabelecimentoId, parsed.data.conta);
  if (!contaId) return { ok: false, error: "Conta financeira não encontrada." };

  const { error } = await supabase.from("movimentacoes_financeiras").insert({
    estabelecimento_id: estabelecimentoId,
    conta_id: contaId,
    categoria_id: categoriaId,
    tipo: "SAIDA",
    natureza: "OPERACIONAL",
    valor_centavos: reaisToCents(parsed.data.valor),
    data_referencia: parsed.data.dataReferencia ?? todayISODate(),
    origem_saida: "ENTRADA_DIA",
    descricao: parsed.data.descricao?.trim() || "Despesa avulsa",
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export async function deleteLancamento(input: { id: string }): Promise<SaveResult> {
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Lancamento invalido." };
  }

  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from("movimentacoes_financeiras")
    .delete()
    .eq("id", parsed.data.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
