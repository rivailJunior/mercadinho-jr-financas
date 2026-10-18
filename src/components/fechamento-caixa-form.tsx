"use client";

import { useState, useMemo, useCallback } from "react";
import { CashEntryCard } from "@/components/cash-entry-card";
import { ExpenseEntryCard } from "@/components/expense-entry-card";
import { DailySummaryCard } from "@/components/daily-summary-card";
import { TOTAL_RESERVA_DIARIA } from "@/constants/cashClosing";
import type { CashEntry, ExpenseEntry, DailySummary } from "@/types/cashClosing";

const INITIAL_CASH: CashEntry = {
  dinheiroGaveta: 0,
  cartao: 0,
  pix: 0,
};

export const FechamentoCaixaForm = () => {
  const [cashEntry, setCashEntry] = useState<CashEntry>(INITIAL_CASH);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([
    { id: crypto.randomUUID(), descricao: "", valor: 0 },
  ]);

  const handleCashChange = useCallback((values: CashEntry) => {
    setCashEntry(values);
  }, []);

  const handleExpensesChange = useCallback((updated: ExpenseEntry[]) => {
    setExpenses(updated);
  }, []);

  const summary: DailySummary = useMemo(() => {
    const totalEntradas =
      cashEntry.dinheiroGaveta + cashEntry.cartao + cashEntry.pix;
    const totalSaidas = expenses.reduce((acc, e) => acc + e.valor, 0);
    const reservaDiaria = TOTAL_RESERVA_DIARIA;
    const sobraLimpa = totalEntradas - totalSaidas - reservaDiaria;

    return {
      totalEntradas,
      totalSaidas,
      reservaDiaria: Math.round(reservaDiaria * 100) / 100,
      sobraLimpa: Math.round(sobraLimpa * 100) / 100,
    };
  }, [cashEntry, expenses]);

  return (
    <div className="flex flex-col gap-(--space-md)">
      <CashEntryCard values={cashEntry} onChange={handleCashChange} />
      <ExpenseEntryCard expenses={expenses} onChange={handleExpensesChange} />
      <DailySummaryCard summary={summary} />
    </div>
  );
};
