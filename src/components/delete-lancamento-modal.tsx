import { formatCurrency } from "@/lib/formatCurrency";
import type { Lancamento } from "@/types/cashClosing";
import { Check, Trash2 } from "lucide-react";

interface DeleteLancamentoModalProps {
  lancamento: Lancamento | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteLancamentoModal = ({
  lancamento,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteLancamentoModalProps) => {
  if (!lancamento) return null;

  return (
    <dialog
      open
      aria-labelledby="delete-lancamento-title"
      className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center shadow-2xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <Trash2 className="h-8 w-8" aria-hidden="true" />
        </div>
        <h3 id="delete-lancamento-title" className="text-lg font-extrabold text-slate-900">
          Apagar este lançamento?
        </h3>
        <p className="text-sm font-medium text-slate-500">
          Deseja apagar &quot;{lancamento.descricao}&quot; no valor de{" "}
          {formatCurrency(lancamento.valor)}?
        </p>

        <div className="mt-2 flex w-full flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 text-sm font-bold text-white shadow-sm transition-transform hover:bg-rose-600 active:scale-95 disabled:opacity-60"
          >
            <Check className="h-5 w-5" aria-hidden="true" />
            <span>{isDeleting ? "Apagando..." : "Sim, Quero Apagar"}</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="h-12 w-full rounded-2xl bg-slate-100 text-sm font-bold text-slate-700 transition-transform hover:bg-slate-200 active:scale-95"
          >
            Não, Manter no Caixa
          </button>
        </div>
      </div>
    </dialog>
  );
};
