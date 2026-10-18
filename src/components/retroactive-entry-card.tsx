"use client";

import { useState, useCallback } from "react";
import { CalendarClock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CurrencyInput } from "@/components/currency-input";
import { formatCurrency } from "@/lib/formatCurrency";

interface RetroactiveFormState {
  data: string;
  dinheiroGaveta: number;
  cartao: number;
  pix: number;
  saidas: number;
}

const INITIAL_STATE: RetroactiveFormState = {
  data: "",
  dinheiroGaveta: 0,
  cartao: 0,
  pix: 0,
  saidas: 0,
};

export const RetroactiveEntryCard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<RetroactiveFormState>(INITIAL_STATE);
  const [submitted, setSubmitted] = useState(false);

  const handleFieldChange = useCallback(
    (field: keyof RetroactiveFormState) => (value: number) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setSubmitted(false);
    },
    [],
  );

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, data: e.target.value }));
      setSubmitted(false);
    },
    [],
  );

  const totalEntradas =
    form.dinheiroGaveta + form.cartao + form.pix;
  const sobraLimpa = totalEntradas - form.saidas;

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
  }, []);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    setSubmitted(false);
    setForm(INITIAL_STATE);
  }, []);

  return (
    <section
      className={cn(
        "rounded-(--rounded-lg) border border-slate-200 bg-white",
        "p-(--space-md) flex flex-col gap-(--space-md)",
      )}
      aria-labelledby="retroactive-title"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-(--space-sm)">
          <div className="flex h-10 w-10 items-center justify-center rounded-(--rounded-md) bg-blue-100">
            <CalendarClock
              className="h-5 w-5 text-blue-700"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2
              id="retroactive-title"
              className="text-[18px] font-semibold leading-6.5 text-slate-900"
            >
              Lançar valor de outro dia
            </h2>
            <p className="text-[14px] leading-5 text-slate-500">
              Esqueceu de fechar algum dia? Anote aqui!
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            "rounded-(--rounded-md) border border-slate-200 bg-white",
            "px-3 py-2 text-[12px] font-semibold leading-4 text-slate-700",
            "transition-colors hover:bg-slate-50",
          )}
          aria-expanded={isOpen}
        >
          {isOpen ? "Fechar" : "Abrir"}
        </button>
      </div>

      {isOpen && (
        <div className="flex flex-col gap-(--space-md) border-t border-slate-100 pt-(--space-md)">
          <div className="flex flex-col gap-(--space-xs)">
            <label
              htmlFor="retro-date"
              className="text-[12px] font-semibold leading-4 tracking-[0.02em] text-slate-700"
            >
              Data
            </label>
            <input
              id="retro-date"
              type="date"
              value={form.data}
              onChange={handleDateChange}
              className={cn(
                "w-full rounded-(--rounded-md) border border-slate-200 bg-white",
                "px-3 py-3 text-[14px] leading-5 text-slate-900",
                "outline-none transition-all",
                "focus:border-primary focus:ring-2 focus:ring-primary/20",
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-(--space-sm)">
            <CurrencyInput
              id="retro-dinheiro"
              label="Dinheiro"
              value={form.dinheiroGaveta}
              onChange={handleFieldChange("dinheiroGaveta")}
            />
            <CurrencyInput
              id="retro-cartao"
              label="Cartão"
              value={form.cartao}
              onChange={handleFieldChange("cartao")}
            />
            <CurrencyInput
              id="retro-pix"
              label="Pix"
              value={form.pix}
              onChange={handleFieldChange("pix")}
            />
            <CurrencyInput
              id="retro-saidas"
              label="Saídas"
              value={form.saidas}
              onChange={handleFieldChange("saidas")}
            />
          </div>

          {totalEntradas > 0 && (
            <div className="flex items-center justify-between rounded-(--rounded-md) bg-slate-50 px-4 py-3">
              <span className="text-[14px] font-medium leading-5 text-slate-700">
                Sobra líquida
              </span>
              <span
                className={cn(
                  "tabular-nums text-[20px] font-bold leading-7",
                  sobraLimpa >= 0 ? "text-green-700" : "text-red-700",
                )}
              >
                {formatCurrency(sobraLimpa)}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!form.data || totalEntradas === 0}
            className={cn(
              "flex w-full items-center justify-center gap-2",
              "rounded-(--rounded-md) bg-primary px-4 py-3",
              "text-[14px] font-semibold leading-5 text-white",
              "transition-colors hover:bg-primary/90",
              "active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {submitted ? (
              <>
                <Check className="h-4 w-4" />
                Salvo!
              </>
            ) : (
              "Salvar Lançamento"
            )}
          </button>
        </div>
      )}
    </section>
  );
};
