"use client";

import { saveEntrada, saveSaida } from "@/app/actions/lancamentos";
import { CashEntryCard } from "@/components/cash-entry-card";
import { DailySummaryCard } from "@/components/daily-summary-card";
import { GreetingHeader } from "@/components/greeting-header";
import { RetroactiveEntryCard } from "@/components/retroactive-entry-card";
import { TOTAL_RESERVA_DIARIA, WEEKLY_DATA } from "@/constants/cashClosing";
import type { CashEntry, DailySummary } from "@/types/cashClosing";
import { useCallback, useMemo, useState } from "react";

const TODAY_INDEX = 3;
const todayData = WEEKLY_DATA[TODAY_INDEX];

const INITIAL_CASH: CashEntry = {
  dinheiroGaveta: todayData.valor,
  cartao: 0,
  pix: 0,
};

export const FechamentoCaixaForm = () => {
  const [cashEntry, setCashEntry] = useState<CashEntry>(INITIAL_CASH);
  const [expenseValue, setExpenseValue] = useState(todayData.saida);
  const [expenseDescription, setExpenseDescription] = useState("Compras de reposição pães e feira");
  const [retroactiveOpen, setRetroactiveOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCashChange = useCallback((values: CashEntry) => {
    setCashEntry(values);
  }, []);

  const handleSaveEntrada = useCallback(async () => {
    const total = cashEntry.dinheiroGaveta + cashEntry.cartao + cashEntry.pix;
    setIsSaving(true);
    setFeedback(null);
    const result = await saveEntrada({ total });
    setIsSaving(false);
    setFeedback(
      result.ok ? "Entrada salva com sucesso!" : `Erro ao salvar entrada: ${result.error}`,
    );
  }, [cashEntry]);

  const handleSaveSaida = useCallback(async () => {
    setIsSaving(true);
    setFeedback(null);
    const result = await saveSaida({
      valor: expenseValue,
      descricao: expenseDescription,
    });
    setIsSaving(false);
    setFeedback(result.ok ? "Saida salva com sucesso!" : `Erro ao salvar saida: ${result.error}`);
  }, [expenseValue, expenseDescription]);

  const summary: DailySummary = useMemo(() => {
    const totalEntradas = cashEntry.dinheiroGaveta + cashEntry.cartao + cashEntry.pix;
    const totalSaidas = expenseValue;
    const reservaDiaria = TOTAL_RESERVA_DIARIA;
    const sobraLimpa = totalEntradas - totalSaidas - reservaDiaria;

    return {
      totalEntradas,
      totalSaidas,
      reservaDiaria: Math.round(reservaDiaria * 100) / 100,
      sobraLimpa: Math.round(sobraLimpa * 100) / 100,
    };
  }, [cashEntry, expenseValue]);

  return (
    <>
      <GreetingHeader onOpenRetroactive={() => setRetroactiveOpen(true)} />

      <div className="space-y-6 px-5 pt-5">
        <CashEntryCard
          cashValues={cashEntry}
          onCashChange={handleCashChange}
          expenseValue={expenseValue}
          expenseDescription={expenseDescription}
          onExpenseValueChange={setExpenseValue}
          onExpenseDescriptionChange={setExpenseDescription}
          onSaveEntrada={handleSaveEntrada}
          onSaveSaida={handleSaveSaida}
        />

        {(isSaving || feedback) && (
          <p className="text-center text-xs font-bold text-slate-500" aria-live="polite">
            {isSaving ? "Salvando..." : feedback}
          </p>
        )}

        <DailySummaryCard summary={summary} />
      </div>

      <RetroactiveEntryCard isOpen={retroactiveOpen} onClose={() => setRetroactiveOpen(false)} />
    </>
  );
};
