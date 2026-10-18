"use client";

import { useCallback } from "react";
import { ArrowDownCircle, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CurrencyInput } from "@/components/currency-input";
import type { ExpenseEntry } from "@/types/cashClosing";

interface ExpenseEntryCardProps {
  expenses: ExpenseEntry[];
  onChange: (expenses: ExpenseEntry[]) => void;
}

export const ExpenseEntryCard = ({
  expenses,
  onChange,
}: ExpenseEntryCardProps) => {
  const handleAddExpense = useCallback(() => {
    const newExpense: ExpenseEntry = {
      id: crypto.randomUUID(),
      descricao: "",
      valor: 0,
    };
    onChange([...expenses, newExpense]);
  }, [expenses, onChange]);

  const handleRemoveExpense = useCallback(
    (id: string) => {
      onChange(expenses.filter((e) => e.id !== id));
    },
    [expenses, onChange],
  );

  const handleValueChange = useCallback(
    (id: string, valor: number) => {
      onChange(expenses.map((e) => (e.id === id ? { ...e, valor } : e)));
    },
    [expenses, onChange],
  );

  const handleDescriptionChange = useCallback(
    (id: string, descricao: string) => {
      onChange(expenses.map((e) => (e.id === id ? { ...e, descricao } : e)));
    },
    [expenses, onChange],
  );

  return (
    <section
      className={cn(
        "rounded-(--rounded-lg) border border-slate-200 bg-white",
        "p-(--space-md) flex flex-col gap-(--space-md)",
      )}
      aria-labelledby="expense-entry-title"
    >
      <div className="flex items-center gap-(--space-sm)">
        <div className="flex h-10 w-10 items-center justify-center rounded-(--rounded-md) bg-red-50">
          <ArrowDownCircle
            className="h-5 w-5 text-red-700"
            aria-hidden="true"
          />
        </div>
        <div>
          <h2
            id="expense-entry-title"
            className="text-[18px] font-semibold leading-6.5 text-slate-900"
          >
            Saídas do Dia
          </h2>
          <p className="text-[14px] leading-5 text-slate-500">
            Pagou fornecedor no balcão, reposição de verduras ou pãozinho? Anote
            aqui!
          </p>
        </div>
      </div>

      <p className="text-[12px] font-medium leading-4 text-slate-500">
        Deduz automaticamente da sobra limpa do dia.
      </p>

      <div className="flex flex-col gap-(--space-sm)">
        {expenses.map((expense, index) => (
          <div
            key={expense.id}
            className="flex items-end gap-(--space-sm) rounded-(--rounded) border border-slate-100 bg-slate-50 p-3"
          >
            <div className="flex flex-1 flex-col gap-(--space-xs)">
              <label
                htmlFor={`expense-desc-${expense.id}`}
                className="text-[12px] font-semibold leading-4 tracking-[0.02em] text-slate-700"
              >
                Descrição
              </label>
              <input
                id={`expense-desc-${expense.id}`}
                type="text"
                value={expense.descricao}
                onChange={(e) =>
                  handleDescriptionChange(expense.id, e.target.value)
                }
                placeholder={`Saída ${index + 1}`}
                className={cn(
                  "w-full rounded-(--rounded-md) border border-slate-200 bg-white",
                  "px-3 py-2.5 text-[14px] leading-5 text-slate-900",
                  "placeholder:text-slate-500/60 outline-none transition-all",
                  "focus:border-primary focus:ring-2 focus:ring-primary/20",
                )}
              />
            </div>

            <div className="w-36">
              <CurrencyInput
                id={`expense-val-${expense.id}`}
                label="Valor"
                value={expense.valor}
                onChange={(v) => handleValueChange(expense.id, v)}
              />
            </div>

            <button
              type="button"
              onClick={() => handleRemoveExpense(expense.id)}
              className={cn(
                "mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center",
                "rounded-(--rounded-md) text-slate-500 transition-colors",
                "hover:bg-red-50 hover:text-red-700",
              )}
              aria-label={`Remover saída: ${expense.descricao || `Saída ${index + 1}`}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddExpense}
        className={cn(
          "flex w-full items-center justify-center gap-2",
          "rounded-(--rounded-md) border border-dashed border-slate-200 bg-slate-50",
          "py-3 text-[14px] font-semibold leading-5 text-slate-700",
          "transition-colors hover:border-primary hover:bg-green-50 hover:text-primary",
        )}
      >
        <Plus className="h-4 w-4" />
        Adicionar Saída
      </button>
    </section>
  );
};
