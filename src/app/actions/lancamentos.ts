"use server";

import { todayISODate } from "@/lib/dates";
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

const entradaSchema = z.object({
  total: z.number().positive(),
  formaPagamento: z.string().min(1).optional(),
  dataReferencia: z.string().optional(),
});

export async function saveEntrada(input: {
  total: number;
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

  const { error } = await supabase.from("lancamentos_caixa").insert({
    estabelecimento_id: estabelecimentoId,
    categoria_id: categoriaId,
    data_referencia: parsed.data.dataReferencia ?? todayISODate(),
    tipo: "ENTRADA",
    valor: parsed.data.total,
    forma_pagamento: parsed.data.formaPagamento ?? "MISTO",
    descricao: "Entrada total do dia",
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

const saidaSchema = z.object({
  valor: z.number().positive(),
  descricao: z.string().optional(),
  dataReferencia: z.string().optional(),
});

export async function saveSaida(input: {
  valor: number;
  descricao?: string;
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

  const { error } = await supabase.from("lancamentos_caixa").insert({
    estabelecimento_id: estabelecimentoId,
    categoria_id: categoriaId,
    data_referencia: parsed.data.dataReferencia ?? todayISODate(),
    tipo: "SAIDA",
    valor: parsed.data.valor,
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
  const { error } = await supabase.from("lancamentos_caixa").delete().eq("id", parsed.data.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

const retroativoSchema = z.object({
  data: z.string().min(1),
  tipo: z.enum(["ENTRADA", "SAIDA"]),
  valor: z.number().positive(),
});

export async function saveRetroativo(input: {
  data: string;
  tipo: "ENTRADA" | "SAIDA";
  valor: number;
}): Promise<SaveResult> {
  const parsed = retroativoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dados do lancamento retroativo invalidos." };
  }

  const supabase = await createSupabaseClient();
  const categoriaNome = parsed.data.tipo === "ENTRADA" ? CATEGORIA_ENTRADA : CATEGORIA_SAIDA;
  const [estabelecimentoId, categoriaId] = await Promise.all([
    getEstabelecimentoId(supabase),
    getCategoriaId(supabase, categoriaNome),
  ]);

  const { error } = await supabase.from("lancamentos_caixa").insert({
    estabelecimento_id: estabelecimentoId,
    categoria_id: categoriaId,
    data_referencia: parsed.data.data,
    tipo: parsed.data.tipo,
    valor: parsed.data.valor,
    descricao: "Lancamento retroativo",
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
