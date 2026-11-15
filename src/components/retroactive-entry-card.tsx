"use client";

import { saveEntrada, saveSaida } from "@/app/actions/lancamentos";
import {
  CONTA_OPCOES,
  ContaSelector,
  type ContaOpcao,
  QUICK_EXPENSE_TAGS,
  SAIDA_ORIGEM_OPCOES,
} from "@/components/cash-entry-card";
import { CurrencyInput } from "@/components/currency-input";
import { daysAgoISODate, formatShortISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { SaidaOrigem } from "@/types/cashClosing";
import { CheckCircle, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type TipoMovimentacao = "entrada" | "saida";

interface RetroactiveEntryCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RetroactiveEntryCard = ({ isOpen, onClose }: RetroactiveEntryCardProps) => {
  const router = useRouter();
  const [data, setData] = useState("");
  const [tipo, setTipo] = useState<TipoMovimentacao>("entrada");
  const [valor, setValor] = useState(0);
  const [entradaConta, setEntradaConta] = useState<ContaOpcao>("CAIXA_FISICO");
  const [saidaOrigem, setSaidaOrigem] = useState<SaidaOrigem>("ENTRADA_DIA");
  const [descricao, setDescricao] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    setData("");
    setValor(0);
    setTipo("entrada");
    setEntradaConta("CAIXA_FISICO");
    setSaidaOrigem("ENTRADA_DIA");
    setDescricao("");
    setError(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    const result =
      tipo === "entrada"
        ? await saveEntrada({ total: valor, conta: entradaConta, dataReferencia: data })
        : await saveSaida({ valor, descricao, origem: saidaOrigem, dataReferencia: data });
    setIsSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Erro ao salvar lancamento.");
      return;
    }
    router.refresh();
    onClose();
    handleReset();
  }, [data, tipo, valor, entradaConta, saidaOrigem, descricao, router, onClose, handleReset]);

  const handleClose = useCallback(() => {
    onClose();
    handleReset();
  }, [onClose, handleReset]);

  if (!isOpen) return null;

  const yesterdayISO = daysAgoISODate(1);
  const dayBeforeISO = daysAgoISODate(2);

  return (
    <dialog
      open
      aria-labelledby="retroactive-title"
      className="fixed inset-0 z-30 m-0 flex h-full max-h-none w-full max-w-none items-end justify-center border-0 bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") handleClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-4xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <div>
              <h3
                id="retroactive-title"
                className="text-base font-extrabold leading-tight text-slate-800"
              >
                Lançar valor de outro dia
              </h3>
              <p className="text-xs text-slate-500">Esqueceu de fechar algum dia? Anote aqui!</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="input-data-escolhida"
            className="block text-xs font-bold uppercase tracking-wide text-slate-600"
          >
            Qual foi o dia que faltou?
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setData(yesterdayISO)}
              className={cn(
                "rounded-xl border px-2 py-2 text-center text-xs font-bold transition-transform active:scale-95",
                data === yesterdayISO
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-slate-50 text-slate-700",
              )}
            >
              Ontem
              <span className="block text-[10px] font-normal text-slate-500">
                {formatShortISODate(yesterdayISO)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setData(dayBeforeISO)}
              className={cn(
                "rounded-xl border px-2 py-2 text-center text-xs font-bold transition-transform active:scale-95",
                data === dayBeforeISO
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-slate-50 text-slate-700",
              )}
            >
              Anteontem
              <span className="block text-[10px] font-normal text-slate-500">
                {formatShortISODate(dayBeforeISO)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("input-data-escolhida");
                if (el) (el as HTMLInputElement).showPicker?.();
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs font-bold text-slate-700 transition-transform active:scale-95"
            >
              Outra data
              <span className="block text-[10px] font-normal text-slate-500">Escolher</span>
            </button>
          </div>
          <input
            id="input-data-escolhida"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <p className="block text-xs font-bold uppercase tracking-wide text-slate-600">
            O que foi essa movimentação?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3",
                tipo === "entrada"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 bg-white",
              )}
            >
              <input
                type="radio"
                name="tipo_retroativo"
                value="entrada"
                checked={tipo === "entrada"}
                onChange={() => setTipo("entrada")}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-black text-emerald-800">💰 Venda (Entrada)</span>
            </label>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3",
                tipo === "saida" ? "border-rose-500 bg-rose-50" : "border-slate-200 bg-white",
              )}
            >
              <input
                type="radio"
                name="tipo_retroativo"
                value="saida"
                checked={tipo === "saida"}
                onChange={() => setTipo("saida")}
                className="text-rose-600 focus:ring-rose-500"
              />
              <span className="text-xs font-black text-rose-800">🛒 Gasto (Saída)</span>
            </label>
          </div>
        </div>

        {tipo === "entrada" && (
          <>


            <div className="space-y-1.5">
              <CurrencyInput
                id="valor-entrada-retroativa"
                label="Quanto entrou no caixa?"
                value={valor}
                onChange={setValor}
                placeholder="0,00"
              />

            </div>

            <ContaSelector
              label="Onde entrou?"
              options={CONTA_OPCOES}
              value={entradaConta}
              onChange={setEntradaConta}
            />
          </>
        )}

        {tipo === "saida" && (
          <>
            {/* <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3">
              <span className="block text-xs font-bold text-rose-800">
                🛒 Registro de Saídas &amp; Despesas Rápidas
              </span>
              <p className="mt-0.5 text-[11px] text-rose-600">
                Pagou fornecedor no balcão, reposição de verduras ou pãozinho? Anote aqui!
              </p>
            </div> */}

            <CurrencyInput
              id="valor-saida-retroativa"
              label="Valor que saiu:"
              value={valor}
              onChange={setValor}
              placeholder="0,00"
            />

            <ContaSelector
              label="De onde saiu?"
              options={SAIDA_ORIGEM_OPCOES}
              value={saidaOrigem}
              onChange={setSaidaOrigem}
            />

            <div className="space-y-1.5">
              <label
                htmlFor="motivo-saida-retroativa"
                className="block text-xs font-bold uppercase tracking-wide text-slate-600"
              >
                Com o que foi gasto? (Descrição simples)
              </label>
              <input
                id="motivo-saida-retroativa"
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Fornecedor de pães, verdura da feira, conta de luz"
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_EXPENSE_TAGS.map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => setDescricao(tag.value)}
                    className="rounded-lg bg-slate-100 px-1.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-200"
                  >
                    {tag.emoji} {tag.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center text-xs font-medium text-slate-400">
              {saidaOrigem === "SALDO_ACUMULADO"
                ? "Sai do saldo acumulado — não altera a sobra do dia."
                : "Deduz automaticamente da sobra limpa do dia."}
            </p>
          </>
        )}

        <div className="space-y-2 pt-2">
          {error && (
            <p className="text-center text-xs font-bold text-rose-600" aria-live="assertive">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!data || valor === 0 || isSaving}
            className={cn(
              "flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-extrabold text-white shadow-button-tap transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
              tipo === "entrada"
                ? "bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                : "bg-linear-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600",
            )}
          >
            <CheckCircle className="h-5 w-5" />
            {isSaving ? "Salvando..." : "Salvar no Dia Escolhido"}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700"
          >
            Cancelar e voltar
          </button>
        </div>
      </div>
    </dialog>
  );
};
