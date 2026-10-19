"use client";

import { useState, useCallback } from 'react';
import { Mic, CheckCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { CurrencyInput } from "@/components/currency-input";
import type { CashEntry } from "@/types/cashClosing";

type ActiveTab = 'entrada' | 'saida';

const QUICK_EXPENSE_TAGS = [
  { emoji: '🥖', label: 'Pão', value: 'Reposição de Pão' },
  { emoji: '🥬', label: 'Feira', value: 'Hortifrúti / Feira' },
  { emoji: '🧾', label: 'Fornecedor', value: 'Boleto de Fornecedor' },
  { emoji: '🔧', label: 'Manutenção', value: 'Gás / Manutenção' },
];

interface CashEntryCardProps {
  cashValues: CashEntry;
  onCashChange: (values: CashEntry) => void;
  expenseValue: number;
  expenseDescription: string;
  onExpenseValueChange: (value: number) => void;
  onExpenseDescriptionChange: (description: string) => void;
  onSaveEntrada: () => void;
  onSaveSaida: () => void;
}

export const CashEntryCard = ({
  cashValues,
  onCashChange,
  expenseValue,
  expenseDescription,
  onExpenseValueChange,
  onExpenseDescriptionChange,
  onSaveEntrada,
  onSaveSaida,
}: CashEntryCardProps) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('entrada');

  const handleCashFieldChange = useCallback(
    (field: keyof CashEntry) => (value: number) => {
      onCashChange({ ...cashValues, [field]: value });
    },
    [cashValues, onCashChange],
  );

  return (
    <section
      className='rounded-3xl border border-indigo-50/50 bg-white p-5 shadow-soft'
      aria-labelledby='cash-entry-title'
    >
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='h-3 w-3 animate-ping rounded-full bg-emerald-500' />
          <h2
            id='cash-entry-title'
            className='text-base font-bold text-slate-700'
          >
            Anotar Caixa do Dia
          </h2>
        </div>
        <span className='rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500'>
          Hoje:{' '}
          {new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
          })}
        </span>
      </div>

      {/* Tabs */}
      <div className='mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1'>
        <button
          type='button'
          onClick={() => setActiveTab('entrada')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all sm:text-sm',
            activeTab === 'entrada'
              ? 'bg-white text-emerald-700 font-extrabold shadow-sm'
              : 'text-slate-500 hover:text-slate-800',
          )}
        >
          <span>💰</span>
          <span>Lançar Entrada (+)</span>
        </button>
        <button
          type='button'
          onClick={() => setActiveTab('saida')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all sm:text-sm',
            activeTab === 'saida'
              ? 'bg-white text-rose-600 font-extrabold shadow-sm'
              : 'text-slate-500 hover:text-slate-800',
          )}
        >
          <span>🛒</span>
          <span>Lançar Saída (-)</span>
        </button>
      </div>

      {/* Tab: Entrada */}
      {activeTab === 'entrada' && (
        <div className='space-y-4'>
          <div className='rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3'>
            <span className='block text-xs font-bold text-emerald-800'>
              ✨ Registro de Vendas de Hoje
            </span>
            <p className='mt-0.5 text-[11px] text-emerald-700'>
              Some aqui o dinheiro físico da gaveta, maquininhas de cartão e Pix
              recebidos.
            </p>
          </div>

          <div className='space-y-1.5'>
            <CurrencyInput
              id='recebimento-bruto'
              label='Quanto entrou no caixa hoje?'
              value={
                cashValues.dinheiroGaveta + cashValues.cartao + cashValues.pix
              }
              onChange={handleCashFieldChange('dinheiroGaveta')}
              placeholder='0,00'
            />
            <p className='pl-1 text-[11px] text-slate-400'>
              <button
                type='button'
                aria-label='Usar microfone para falar valor'
                className='mr-1 inline-flex align-middle text-slate-400 transition-colors hover:text-indigo-600'
              >
                <Mic className='h-4 w-4' />
              </button>
              Dica: pode falar no microfone: &quot;Três mil duzentos e
              cinquenta&quot;.
            </p>
          </div>

          <div className='pt-1'>
            <button
              type='button'
              onClick={onSaveEntrada}
              className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-500 px-6 py-4 text-base font-extrabold text-white shadow-button-tap transition-all duration-150 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98]'
            >
              <CheckCircle className='h-5 w-5' />
              Salvar Vendas do Dia (+)
            </button>
            <div className='mt-2.5 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400'>
              <CheckCircle className='h-3.5 w-3.5 text-emerald-500' />
              Sincroniza direto na planilha da família
            </div>
          </div>
        </div>
      )}

      {/* Tab: Saída */}
      {activeTab === 'saida' && (
        <div className='space-y-4'>
          <div className='rounded-2xl border border-rose-100 bg-rose-50 p-3'>
            <span className='block text-xs font-bold text-rose-800'>
              🛒 Registro de Saídas &amp; Despesas Rápidas
            </span>
            <p className='mt-0.5 text-[11px] text-rose-600'>
              Pagou fornecedor no balcão, reposição de verduras ou pãozinho?
              Anote aqui!
            </p>
          </div>

          <CurrencyInput
            id='saida-despesas'
            label='Valor que saiu da gaveta:'
            value={expenseValue}
            onChange={onExpenseValueChange}
            placeholder='0,00'
          />

          <div className='space-y-1.5'>
            <label
              htmlFor='motivo-saida'
              className='block text-xs font-bold uppercase tracking-wide text-slate-600'
            >
              Com o que foi gasto? (Descrição simples)
            </label>
            <input
              id='motivo-saida'
              type='text'
              value={expenseDescription}
              onChange={(e) => onExpenseDescriptionChange(e.target.value)}
              placeholder='Ex: Fornecedor de pães, verdura da feira, conta de luz'
              className='w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white'
            />
            <div className='flex flex-wrap gap-1.5 pt-1'>
              {QUICK_EXPENSE_TAGS.map((tag) => (
                <button
                  key={tag.label}
                  type='button'
                  onClick={() => onExpenseDescriptionChange(tag.value)}
                  className='rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-200'
                >
                  {tag.emoji} {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div className='pt-1'>
            <button
              type='button'
              onClick={onSaveSaida}
              className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-rose-500 to-amber-500 px-6 py-4 text-base font-extrabold text-white shadow-card-coral transition-all duration-150 hover:from-rose-600 hover:to-amber-600 active:scale-[0.98]'
            >
              <CheckCircle className='h-5 w-5' />
              Salvar Saída do Caixa (-)
            </button>
            <p className='mt-2 text-center text-xs font-medium text-slate-400'>
              Deduz automaticamente da sobra limpa do dia.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
