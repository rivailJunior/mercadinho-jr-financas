"use client";

import { useCallback, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, parseCurrencyInput } from "@/lib/formatCurrency";

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  id: string;
}

export const CurrencyInput = ({
  label,
  value,
  onChange,
  placeholder = "R$ 0,00",
  id,
}: CurrencyInputProps) => {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const parsed = parseCurrencyInput(e.target.value);
      onChange(parsed);
    },
    [onChange],
  );

  const displayValue = value > 0 ? formatCurrency(value) : "";

  return (
    <div className="flex flex-col gap-(--space-xs)">
      <label
        htmlFor={id}
        className="text-[12px] font-semibold leading-4 tracking-[0.02em] text-slate-700"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <span
          className={cn(
            "absolute left-3 text-[14px] font-medium text-slate-500",
            "pointer-events-none select-none",
          )}
          aria-hidden="true"
        >
          R$
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "tabular-nums w-full rounded-(--rounded-md) border border-slate-200 bg-white",
            "py-3 pl-10 pr-4 text-[16px] font-medium leading-6 text-slate-900",
            "placeholder:text-slate-500/60",
            "outline-none transition-all",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
          )}
          aria-label={label}
        />
      </div>
    </div>
  );
};
