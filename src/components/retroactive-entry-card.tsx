"use client";

import { useState, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { CurrencyInput } from '@/components/currency-input';

type TipoMovimentacao = 'entrada' | 'saida';

interface RetroactiveEntryCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RetroactiveEntryCard = ({
  isOpen,
  onClose,
}: RetroactiveEntryCardProps) => {
  const [data, setData] = useState('');
  const [tipo, setTipo] = useState<TipoMovimentacao>('entrada');
  const [valor, setValor] = useState(0);

  const handleReset = useCallback(() => {
    setData('');
    setValor(0);
    setTipo('entrada');
  }, []);

  const handleConfirm = useCallback(() => {
    onClose();
    handleReset();
  }, [onClose, handleReset]);

  const handleClose = useCallback(() => {
    onClose();
    handleReset();
  }, [onClose, handleReset]);

  if (!isOpen) return null;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dayBefore = new Date();
  dayBefore.setDate(dayBefore.getDate() - 2);

  const formatShortDate = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const toInputDate = (d: Date) => d.toISOString().split('T')[0];

  return (
    <div
      className='fixed inset-0 z-30 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4'
      onClick={handleClose}
      role='dialog'
      aria-modal='true'
      aria-labelledby='retroactive-title'
    >
      <div
        className='max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-4xl bg-white p-6 shadow-2xl sm:rounded-3xl'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between border-b border-slate-100 pb-2'>
          <div className='flex items-center gap-2'>
            <span className='text-2xl'>📅</span>
            <div>
              <h3
                id='retroactive-title'
                className='text-base font-extrabold leading-tight text-slate-800'
              >
                Lançar valor de outro dia
              </h3>
              <p className='text-xs text-slate-500'>
                Esqueceu de fechar algum dia? Anote aqui!
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={handleClose}
            className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-200'
          >
            ✕
          </button>
        </div>

        <div className='space-y-1.5'>
          <label className='block text-xs font-bold uppercase tracking-wide text-slate-600'>
            Qual foi o dia que faltou?
          </label>
          <div className='grid grid-cols-3 gap-2'>
            <button
              type='button'
              onClick={() => setData(toInputDate(yesterday))}
              className={cn(
                'rounded-xl border px-2 py-2 text-center text-xs font-bold transition-transform active:scale-95',
                data === toInputDate(yesterday)
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700',
              )}
            >
              Ontem
              <span className='block text-[10px] font-normal text-slate-500'>
                {formatShortDate(yesterday)}
              </span>
            </button>
            <button
              type='button'
              onClick={() => setData(toInputDate(dayBefore))}
              className={cn(
                'rounded-xl border px-2 py-2 text-center text-xs font-bold transition-transform active:scale-95',
                data === toInputDate(dayBefore)
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700',
              )}
            >
              Anteontem
              <span className='block text-[10px] font-normal text-slate-500'>
                {formatShortDate(dayBefore)}
              </span>
            </button>
            <button
              type='button'
              onClick={() => {
                const el = document.getElementById('input-data-escolhida');
                if (el) (el as HTMLInputElement).showPicker?.();
              }}
              className='rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs font-bold text-slate-700 transition-transform active:scale-95'
            >
              Outra data
              <span className='block text-[10px] font-normal text-slate-500'>
                Escolher
              </span>
            </button>
          </div>
          <input
            id='input-data-escolhida'
            type='date'
            value={data}
            onChange={(e) => setData(e.target.value)}
            className='mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none'
          />
        </div>

        <div className='space-y-1.5'>
          <label className='block text-xs font-bold uppercase tracking-wide text-slate-600'>
            O que foi essa movimentação?
          </label>
          <div className='grid grid-cols-2 gap-2'>
            <label
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3',
                tipo === 'entrada'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 bg-white',
              )}
            >
              <input
                type='radio'
                name='tipo_retroativo'
                value='entrada'
                checked={tipo === 'entrada'}
                onChange={() => setTipo('entrada')}
                className='text-emerald-600 focus:ring-emerald-500'
              />
              <span className='text-xs font-black text-emerald-800'>
                💰 Venda (Entrada)
              </span>
            </label>
            <label
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3',
                tipo === 'saida'
                  ? 'border-rose-500 bg-rose-50'
                  : 'border-slate-200 bg-white',
              )}
            >
              <input
                type='radio'
                name='tipo_retroativo'
                value='saida'
                checked={tipo === 'saida'}
                onChange={() => setTipo('saida')}
                className='text-rose-600 focus:ring-rose-500'
              />
              <span className='text-xs font-black text-rose-800'>
                🛒 Gasto (Saída)
              </span>
            </label>
          </div>
        </div>

        <div className='space-y-1.5'>
          <label
            htmlFor='valor-outro-dia'
            className='block text-xs font-bold uppercase tracking-wide text-slate-600'
          >
            Valor movimentado:
          </label>
          <CurrencyInput
            id='valor-outro-dia'
            label=''
            value={valor}
            onChange={setValor}
            placeholder='R$ 0,00'
          />
        </div>

        <div className='space-y-2 pt-2'>
          <button
            type='button'
            onClick={handleConfirm}
            disabled={!data || valor === 0}
            className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <span>✓</span>
            <span>Confirmar e Salvar no Dia Escolhido</span>
          </button>
          <button
            type='button'
            onClick={handleClose}
            className='w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700'
          >
            Cancelar e voltar
          </button>
        </div>
      </div>
    </div>
  );
};
