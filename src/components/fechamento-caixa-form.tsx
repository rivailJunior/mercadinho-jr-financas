"use client";

import { saveEntrada, saveSaida } from "@/app/actions/lancamentos";
import { CashEntryCard } from "@/components/cash-entry-card";
import { DailySummaryCard } from "@/components/daily-summary-card";
import { GreetingHeader } from "@/components/greeting-header";
import { RetroactiveEntryCard } from "@/components/retroactive-entry-card";
import type { CashEntry, DailySummary } from "@/types/cashClosing";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

interface FechamentoCaixaFormProps {
  initialEntrada: number;
  initialSaida: number;
  reservaDiaria: number;
}

export const FechamentoCaixaForm = ({
  initialEntrada,
  initialSaida,
  reservaDiaria,
}: FechamentoCaixaFormProps) => {
  const router = useRouter();
  const [cashEntry, setCashEntry] = useState<CashEntry>({
    dinheiroGaveta: initialEntrada,
    cartao: 0,
    pix: 0,
  });
  const [expenseValue, setExpenseValue] = useState(initialSaida);
  const [expenseDescription, setExpenseDescription] = useState("");
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
    if (result.ok) router.refresh();
  }, [cashEntry, router]);

  const handleSaveSaida = useCallback(async () => {
    setIsSaving(true);
    setFeedback(null);
    const result = await saveSaida({
      valor: expenseValue,
      descricao: expenseDescription,
    });
    setIsSaving(false);
    setFeedback(result.ok ? "Saida salva com sucesso!" : `Erro ao salvar saida: ${result.error}`);
    if (result.ok) router.refresh();
  }, [expenseValue, expenseDescription, router]);

  const summary: DailySummary = useMemo(() => {
    const totalEntradas = cashEntry.dinheiroGaveta + cashEntry.cartao + cashEntry.pix;
    const sobraLimpa = totalEntradas - expenseValue - reservaDiaria;

    return {
      totalEntradas,
      totalSaidas: expenseValue,
      reservaDiaria: Math.round(reservaDiaria * 100) / 100,
      sobraLimpa: Math.round(sobraLimpa * 100) / 100,
    };
  }, [cashEntry, expenseValue, reservaDiaria]);

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
