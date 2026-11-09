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

/**
 * Mirrors the legacy lancamento into the new money model: every daily
 * entrada/saida is also a real account movement, so the account balances
 * the family sees in /financas always reflect what was recorded.
 */
const registrarMovimentoConta = async (
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  args: {
    estabelecimentoId: string;
    contaTipo: z.infer<typeof contaSchema>;
    tipo: "ENTRADA" | "SAIDA";
    valorReais: number;
    dataReferencia: string;
    descricao: string;
    lancamentoId: string;
  },
): Promise<{ error: string } | null> => {
  const contaId = await getContaId(supabase, args.estabelecimentoId, args.contaTipo);
  if (!contaId) return { error: "Conta financeira não encontrada." };
  const { error } = await supabase.from("movimentacoes_financeiras").insert({
    estabelecimento_id: args.estabelecimentoId,
    conta_id: contaId,
    lancamento_id: args.lancamentoId,
    tipo: args.tipo,
    natureza: "OPERACIONAL",
    valor_centavos: reaisToCents(args.valorReais),
    data_referencia: args.dataReferencia,
    descricao: args.descricao,
  });
  return error ? { error: error.message } : null;
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
  const dataReferencia = parsed.data.dataReferencia ?? todayISODate();

  const { data: lancamento, error } = await supabase
    .from("lancamentos_caixa")
    .insert({
      estabelecimento_id: estabelecimentoId,
      categoria_id: categoriaId,
      data_referencia: dataReferencia,
      tipo: "ENTRADA",
      valor: parsed.data.total,
      forma_pagamento: parsed.data.formaPagamento ?? "MISTO",
      descricao: "Entrada total do dia",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  const mov = await registrarMovimentoConta(supabase, {
    estabelecimentoId,
    contaTipo: parsed.data.conta,
    tipo: "ENTRADA",
    valorReais: parsed.data.total,
    dataReferencia,
    descricao:
      parsed.data.conta === "MAQUININHA"
        ? "Entrada do dia (maquininha/Pix)"
        : "Entrada do dia (dinheiro)",
    lancamentoId: lancamento.id,
  });
  if (mov) {
    // Keep the two records in sync: without the movement the account
    // balances would silently drift, so undo the lancamento and fail loudly.
    await supabase.from("lancamentos_caixa").delete().eq("id", lancamento.id);
    return { ok: false, error: mov.error };
  }
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
  const dataReferencia = parsed.data.dataReferencia ?? todayISODate();

  const { data: lancamento, error } = await supabase
    .from("lancamentos_caixa")
    .insert({
      estabelecimento_id: estabelecimentoId,
      categoria_id: categoriaId,
      data_referencia: dataReferencia,
      tipo: "SAIDA",
      valor: parsed.data.valor,
      descricao: parsed.data.descricao?.trim() || "Despesa avulsa",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  const mov = await registrarMovimentoConta(supabase, {
    estabelecimentoId,
    contaTipo: parsed.data.conta,
    tipo: "SAIDA",
    valorReais: parsed.data.valor,
    dataReferencia,
    descricao: parsed.data.descricao?.trim() || "Despesa avulsa",
    lancamentoId: lancamento.id,
  });
  if (mov) {
    await supabase.from("lancamentos_caixa").delete().eq("id", lancamento.id);
    return { ok: false, error: mov.error };
  }
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
  // movimentacoes_financeiras.lancamento_id is ON DELETE CASCADE, so the
  // mirrored account movement is removed together with the lancamento.
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

  if (!estabelecimentoId) return { ok: false, error: "Estabelecimento não encontrado." };

  const { data: lancamento, error } = await supabase
    .from("lancamentos_caixa")
    .insert({
      estabelecimento_id: estabelecimentoId,
      categoria_id: categoriaId,
      data_referencia: parsed.data.data,
      tipo: parsed.data.tipo,
      valor: parsed.data.valor,
      descricao: "Lancamento retroativo",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  // Retroactive entries assume the physical drawer — that is where missed
  // daily cash belongs — and stay linked via lancamento_id for rollback.
  const mov = await registrarMovimentoConta(supabase, {
    estabelecimentoId,
    contaTipo: "CAIXA_FISICO",
    tipo: parsed.data.tipo,
    valorReais: parsed.data.valor,
    dataReferencia: parsed.data.data,
    descricao: "Lancamento retroativo",
    lancamentoId: lancamento.id,
  });
  if (mov) {
    await supabase.from("lancamentos_caixa").delete().eq("id", lancamento.id);
    return { ok: false, error: mov.error };
  }
  return { ok: true };
}
