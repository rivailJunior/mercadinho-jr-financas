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
  placeholder = '0,00',
  id,
}: CurrencyInputProps) => {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const parsed = parseCurrencyInput(e.target.value);
      onChange(parsed);
    },
    [onChange],
  );

  const displayValue = value > 0 ? formatCurrency(value) : '';

  return (
    <div className='flex flex-col gap-1'>
      {label && (
        <label
          htmlFor={id}
          className='block text-xs font-bold uppercase tracking-wide text-slate-600'
        >
          {label}
        </label>
      )}
      <div className='relative flex items-center'>
        <span
          className='pointer-events-none absolute left-4 select-none text-xl font-bold text-slate-400'
          aria-hidden='true'
        >
          R$
        </span>
        <input
          id={id}
          type='text'
          inputMode='decimal'
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            'tabular-nums w-full rounded-2xl border-2 border-slate-200 bg-slate-50',
            'py-3.5 pl-14 pr-4 text-2xl font-extrabold text-slate-800',
            'placeholder:text-slate-400',
            'outline-none transition-all',
            'focus:border-indigo-500 focus:bg-white',
          )}
          aria-label={label || 'Valor em reais'}
        />
      </div>
    </div>
  );
};
