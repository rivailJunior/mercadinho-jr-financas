import { TransactionItem } from "@/components/transaction-item";
import type { Lancamento } from "@/types/cashClosing";
import { ReceiptText } from "lucide-react";

interface TransactionsCardProps {
  lancamentos: Lancamento[];
  totalCount: number;
  onDelete: (lancamento: Lancamento) => void;
}

export const TransactionsCard = ({ lancamentos, totalCount, onDelete }: TransactionsCardProps) => {
  return (
    <section className="flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <ReceiptText className="h-[18px] w-[18px]" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Lançamentos no Caixa</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
          {totalCount} {totalCount === 1 ? "item" : "itens"}
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {lancamentos.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm font-medium text-slate-400">
            Nenhum lançamento encontrado.
          </p>
        ) : (
          lancamentos.map((lancamento) => (
            <TransactionItem key={lancamento.id} lancamento={lancamento} onDelete={onDelete} />
          ))
        )}
      </div>
    </section>
  );
};
