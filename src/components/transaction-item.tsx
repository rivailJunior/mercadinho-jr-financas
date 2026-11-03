import { formatLancamentoDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/formatCurrency";
import { cn } from "@/lib/utils";
import type { Lancamento, LancamentoTipo } from "@/types/cashClosing";
import {
  Banknote,
  Croissant,
  HandCoins,
  type LucideIcon,
  ShoppingBasket,
  Trash2,
  Truck,
  Zap,
} from "lucide-react";

const pickIcon = (descricao: string, tipo: LancamentoTipo): LucideIcon => {
  const d = descricao.toLowerCase();
  if (/luz|energia|eletr|enel/.test(d)) return Zap;
  if (/fornecedor|distribuidora|ceasa|entrega|mercadoria/.test(d)) return Truck;
  if (/p[ãa]o|padaria|french/.test(d)) return Croissant;
  if (/venda|balc[ãa]o|pix|cart[ãa]o/.test(d)) return Banknote;
  return tipo === "ENTRADA" ? HandCoins : ShoppingBasket;
};

interface TransactionItemProps {
  lancamento: Lancamento;
  onDelete: (lancamento: Lancamento) => void;
}

export const TransactionItem = ({ lancamento, onDelete }: TransactionItemProps) => {
  const isEntrada = lancamento.tipo === "ENTRADA";
  const Icon = pickIcon(lancamento.descricao, lancamento.tipo);

  return (
    <article className="flex items-center justify-between gap-3 p-4 transition-colors odd:bg-slate-50/60 active:bg-slate-100/80">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
            isEntrada ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
          )}
        >
          <Icon className="h-[22px] w-[22px]" aria-hidden="true" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold leading-snug text-slate-900">
            {lancamento.descricao}
          </span>
          <div className="mt-0.5 flex items-center gap-2">
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-extrabold",
                isEntrada ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
              )}
            >
              {isEntrada ? "Entrada (+)" : "Saída (-)"}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {formatLancamentoDate(lancamento.dataReferencia)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "tabular-nums whitespace-nowrap text-sm font-extrabold",
            isEntrada ? "text-emerald-600" : "text-rose-600",
          )}
        >
          {isEntrada ? "+" : "-"} {formatCurrency(lancamento.valor)}
        </span>
        <button
          type="button"
          aria-label={`Excluir ${lancamento.descricao}`}
          onClick={() => onDelete(lancamento)}
          className="flex items-center justify-center rounded-xl bg-rose-50 p-2 text-rose-500 transition-all hover:bg-rose-100 active:scale-95"
        >
          <Trash2 className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
};
