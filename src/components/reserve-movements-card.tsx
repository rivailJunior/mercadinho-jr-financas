"use client";

import { desfazerAporteReserva } from "@/app/actions/financeiro";
import type { MovimentoReserva } from "@/lib/finance/data";
import { formatCents } from "@/lib/money";
import { Check, History, Trash2 } from "lucide-react";
import { useState } from "react";

interface ReserveMovementsCardProps {
  movimentos: MovimentoReserva[];
}

export const ReserveMovementsCard = ({ movimentos }: ReserveMovementsCardProps) => {
  const [deleteTarget, setDeleteTarget] = useState<MovimentoReserva | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setError(null);
    const result = await desfazerAporteReserva({ movimentacaoId: deleteTarget.id });
    setIsDeleting(false);
    if (result.ok) setDeleteTarget(null);
    else setError(result.error ?? "Não foi possível desfazer.");
  };

  if (movimentos.length === 0) return null;

  return (
    <section
      aria-labelledby="historico-reservas-title"
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <History className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3
            id="historico-reservas-title"
            className="text-sm font-extrabold leading-snug text-slate-800"
          >
            Histórico de reservas
          </h3>
          <p className="text-xs text-slate-500">Últimos valores guardados e retirados.</p>
        </div>
      </div>

      {error && <p className="mb-2 text-xs font-semibold text-rose-600">{error}</p>}

      <ul className="space-y-2 border-t border-slate-100 pt-3">
        {movimentos.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <span className="block truncate font-semibold text-slate-700">
                {m.descricao ?? m.reservaNome}
              </span>
              <span className="text-[11px] text-slate-400">
                {m.reservaNome} · {m.dataReferencia.split("-").reverse().join("/")}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`tabular-nums font-bold ${
                  m.tipo === "APORTE" ? "text-indigo-600" : "text-slate-600"
                }`}
              >
                {m.tipo === "APORTE" ? "+" : "−"}
                {formatCents(m.valor)}
              </span>
              {m.tipo === "APORTE" && (
                <button
                  type="button"
                  aria-label={`Desfazer aporte de ${formatCents(m.valor)}`}
                  onClick={() => setDeleteTarget(m)}
                  className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {deleteTarget && (
        <dialog
          open
          aria-labelledby="desfazer-aporte-title"
          className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setDeleteTarget(null);
          }}
        >
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <Trash2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <h3 id="desfazer-aporte-title" className="text-lg font-extrabold text-slate-900">
              Desfazer este aporte?
            </h3>
            <p className="text-sm font-medium text-slate-500">
              Os {formatCents(deleteTarget.valor)} guardados em &quot;{deleteTarget.reservaNome}
              &quot; voltam para o saldo livre.
            </p>
            <div className="mt-2 flex w-full flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isDeleting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 text-sm font-bold text-white shadow-sm transition-transform hover:bg-rose-600 active:scale-95 disabled:opacity-60"
              >
                <Check className="h-5 w-5" aria-hidden="true" />
                <span>{isDeleting ? "Desfazendo..." : "Sim, Desfazer"}</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="h-12 w-full rounded-2xl bg-slate-100 text-sm font-bold text-slate-700 transition-transform hover:bg-slate-200 active:scale-95"
              >
                Não, Manter Guardado
              </button>
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
};
