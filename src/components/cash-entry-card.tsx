"use client";

import { Mic, Banknote, CreditCard, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { CurrencyInput } from "@/components/currency-input";
import type { CashEntry } from "@/types/cashClosing";

interface CashEntryCardProps {
  values: CashEntry;
  onChange: (values: CashEntry) => void;
}

export const CashEntryCard = ({ values, onChange }: CashEntryCardProps) => {
  const handleFieldChange = (field: keyof CashEntry) => (value: number) => {
    onChange({ ...values, [field]: value });
  };

  return (
    <section
      className={cn(
        "rounded-(--rounded-lg) border border-slate-200 bg-white",
        "p-(--space-md) flex flex-col gap-(--space-md)",
      )}
      aria-labelledby="cash-entry-title"
    >
      <div className="flex items-center gap-(--space-sm)">
        <div className="flex h-10 w-10 items-center justify-center rounded-(--rounded-md) bg-green-100">
          <Banknote className="h-5 w-5 text-green-700" aria-hidden="true" />
        </div>
        <div>
          <h2
            id="cash-entry-title"
            className="text-[18px] font-semibold leading-6.5 text-slate-900"
          >
            Anotar Caixa do Dia
          </h2>
          <p className="text-[14px] leading-5 text-slate-500">
            Some aqui o dinheiro físico da gaveta, maquininhas de cartão e Pix
            recebidos.
          </p>
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-(--space-sm) rounded-(--rounded) bg-green-50",
          "px-3 py-2 text-[12px] font-medium leading-4 text-green-700",
        )}
        role="note"
      >
        <Mic className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Dica: pode falar no microfone: &quot;Três mil duzentos e
          cinquenta&quot;.
        </span>
      </div>

      <div className="flex flex-col gap-(--space-md)">
        <div className="relative">
          <CurrencyInput
            id="dinheiro-gaveta"
            label="Dinheiro na Gaveta"
            value={values.dinheiroGaveta}
            onChange={handleFieldChange("dinheiroGaveta")}
            placeholder="R$ 0,00"
          />
          <Banknote
            className="absolute right-3 top-9.5 h-5 w-5 text-slate-500/40"
            aria-hidden="true"
          />
        </div>

        <div className="relative">
          <CurrencyInput
            id="cartao"
            label="Maquininhas (Cartão)"
            value={values.cartao}
            onChange={handleFieldChange("cartao")}
            placeholder="R$ 0,00"
          />
          <CreditCard
            className="absolute right-3 top-9.5 h-5 w-5 text-slate-500/40"
            aria-hidden="true"
          />
        </div>

        <div className="relative">
          <CurrencyInput
            id="pix"
            label="Pix Recebido"
            value={values.pix}
            onChange={handleFieldChange("pix")}
            placeholder="R$ 0,00"
          />
          <Smartphone
            className="absolute right-3 top-9.5 h-5 w-5 text-slate-500/40"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
};
