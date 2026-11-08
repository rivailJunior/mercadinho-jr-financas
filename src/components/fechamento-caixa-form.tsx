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
}

export const FechamentoCaixaForm = ({ initialEntrada, initialSaida }: FechamentoCaixaFormProps) => {
  const router = useRouter();
  const [cashEntry, setCashEntry] = useState<CashEntry>({
    dinheiroGaveta: initialEntrada,
    cartao: 0,
    pix: 0,
  });
  const [expenseValue, setExpenseValue] = useState(initialSaida);
  const [expenseDescription, setExpenseDescription] = useState("");
  const [entradaConta, setEntradaConta] = useState<"CAIXA_FISICO" | "MAQUININHA">("CAIXA_FISICO");
  const [saidaConta, setSaidaConta] = useState<"CAIXA_FISICO" | "MAQUININHA">("CAIXA_FISICO");
  const [retroactiveOpen, setRetroactiveOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<(ToastMessage & { id: number }) | null>(null);

  const handleCashChange = useCallback((values: CashEntry) => {
    setCashEntry(values);
  }, []);

  const handleDismissToast = useCallback(() => setToast(null), []);

  const handleSaveEntrada = useCallback(async () => {
    const total = cashEntry.dinheiroGaveta + cashEntry.cartao + cashEntry.pix;
    setIsSaving(true);
    try {
      const result = await saveEntrada({ total, conta: entradaConta });
      if (result.ok) {
        setCashEntry({ dinheiroGaveta: 0, cartao: 0, pix: 0 });
        setToast({ id: Date.now(), variant: "success", message: "Entrada Salva!" });
        router.refresh();
      } else {
        setToast({
          id: Date.now(),
          variant: "error",
          message: `Erro ao salvar entrada: ${result.error}`,
        });
      }
    } finally {
      setIsSaving(false);
    }
  }, [cashEntry, entradaConta, router]);

  const handleSaveSaida = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await saveSaida({
        valor: expenseValue,
        descricao: expenseDescription,
        conta: saidaConta,
      });
      if (result.ok) {
        setExpenseValue(0);
        setExpenseDescription("");
        setToast({ id: Date.now(), variant: "success", message: "Saída Salva!" });
        router.refresh();
      } else {
        setToast({
          id: Date.now(),
          variant: "error",
          message: `Erro ao salvar saída: ${result.error}`,
        });
      }
    } finally {
      setIsSaving(false);
    }
  }, [expenseValue, expenseDescription, saidaConta, router]);

  const summary: DailySummary = useMemo(() => {
    const totalEntradas = cashEntry.dinheiroGaveta + cashEntry.cartao + cashEntry.pix;
    const sobraLimpa = totalEntradas - expenseValue;

    return {
      totalEntradas,
      totalSaidas: expenseValue,
      sobraLimpa: Math.round(sobraLimpa * 100) / 100,
    };
  }, [cashEntry, expenseValue]);

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
          entradaConta={entradaConta}
          onEntradaContaChange={setEntradaConta}
          saidaConta={saidaConta}
          onSaidaContaChange={setSaidaConta}
          onSaveEntrada={handleSaveEntrada}
          onSaveSaida={handleSaveSaida}
          isSaving={isSaving}
        />

        <DailySummaryCard summary={summary} />
      </div>

      <RetroactiveEntryCard isOpen={retroactiveOpen} onClose={() => setRetroactiveOpen(false)} />
    </>
  );
};
