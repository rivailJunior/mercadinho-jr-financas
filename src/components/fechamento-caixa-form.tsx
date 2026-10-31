"use client";

import { saveEntrada, saveSaida } from "@/app/actions/lancamentos";
import { CashEntryCard } from "@/components/cash-entry-card";
import { DailySummaryCard } from "@/components/daily-summary-card";
import { GreetingHeader } from "@/components/greeting-header";
import { RetroactiveEntryCard } from "@/components/retroactive-entry-card";
import { Toast, type ToastMessage } from "@/components/toast";
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
  const [toast, setToast] = useState<(ToastMessage & { id: number }) | null>(null);

  const handleCashChange = useCallback((values: CashEntry) => {
    setCashEntry(values);
  }, []);

  const handleDismissToast = useCallback(() => setToast(null), []);

  const handleSaveEntrada = useCallback(async () => {
    const total = cashEntry.dinheiroGaveta + cashEntry.cartao + cashEntry.pix;
    const result = await saveEntrada({ total });
    if (result.ok) {
      setToast({ id: Date.now(), variant: "success", message: "Entrada Salva!" });
      router.refresh();
    } else {
      setToast({
        id: Date.now(),
        variant: "error",
        message: `Erro ao salvar entrada: ${result.error}`,
      });
    }
  }, [cashEntry, router]);

  const handleSaveSaida = useCallback(async () => {
    const result = await saveSaida({
      valor: expenseValue,
      descricao: expenseDescription,
    });
    if (result.ok) {
      setToast({ id: Date.now(), variant: "success", message: "Saída Salva!" });
      router.refresh();
    } else {
      setToast({
        id: Date.now(),
        variant: "error",
        message: `Erro ao salvar saída: ${result.error}`,
      });
    }
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
      {toast && <Toast key={toast.id} toast={toast} onDismiss={handleDismissToast} />}

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

        <DailySummaryCard summary={summary} />
      </div>

      <RetroactiveEntryCard isOpen={retroactiveOpen} onClose={() => setRetroactiveOpen(false)} />
    </>
  );
};
