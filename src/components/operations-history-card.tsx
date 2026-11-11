"use client";

import {
  desfazerAporteReserva,
  desfazerPagamento,
  desfazerTransferencia,
} from "@/app/actions/financeiro";
import type { MovimentoReserva, Pagamento, Transferencia } from "@/lib/finance/data";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, Check, History, PiggyBank, ReceiptText, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Aba = "reservas" | "transferencias" | "pagamentos";

const ABAS: { id: Aba; label: string; icon: typeof PiggyBank }[] = [
  { id: "reservas", label: "Reservas", icon: PiggyBank },
  { id: "transferencias", label: "Transferir", icon: ArrowLeftRight },
  { id: "pagamentos", label: "Pagamentos", icon: ReceiptText },
];

interface OperationsHistoryCardProps {
  movimentos: MovimentoReserva[];
  transferencias: Transferencia[];
  pagamentos: Pagamento[];
}

const formatData = (iso: string) => iso.split("-").reverse().join("/");

const EmptyTab = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-xs font-medium text-slate-400">
    {children}
  </p>
);

const Row = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <li className="flex items-center justify-between gap-2 text-xs">
    <div className="min-w-0">
      <span className="block truncate font-semibold text-slate-700">{title}</span>
      <span className="text-[11px] text-slate-400">{subtitle}</span>
    </div>
    <div className="flex shrink-0 items-center gap-2">{children}</div>
  </li>
);

type DeleteTarget =
  | { kind: "aporte"; mov: MovimentoReserva }
  | { kind: "transferencia"; t: Transferencia }
  | { kind: "pagamento"; p: Pagamento };

export const OperationsHistoryCard = ({
  movimentos,
  transferencias,
  pagamentos,
}: OperationsHistoryCardProps) => {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("reservas");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setError(null);
    const result =
      deleteTarget.kind === "aporte"
        ? await desfazerAporteReserva({ movimentacaoId: deleteTarget.mov.id })
        : deleteTarget.kind === "transferencia"
          ? await desfazerTransferencia({ transferenciaId: deleteTarget.t.id })
          : await desfazerPagamento({ movimentacaoId: deleteTarget.p.id });
    setIsDeleting(false);
    if (result.ok) {
      setDeleteTarget(null);
      router.refresh();
    } else {
      setError(result.error ?? "Não foi possível desfazer.");
      setDeleteTarget(null);
    }
  };

  // Compromissos settled by an internal transfer show up in the Pagamentos
  // tab — not here, where they'd look like a free money move.
  const settlementIds = new Set(
    pagamentos.map((p) => p.transferenciaId).filter((id): id is string => id != null),
  );
  const transferenciasVisiveis = transferencias.filter((t) => !settlementIds.has(t.id));

  if (movimentos.length === 0 && transferenciasVisiveis.length === 0 && pagamentos.length === 0)
    return null;

  return (
    <section
      aria-labelledby="historico-ops-title"
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <History className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3
            id="historico-ops-title"
            className="text-sm font-extrabold leading-snug text-slate-800"
          >
            Histórico
          </h3>
          <p className="text-xs text-slate-500">Últimas transferências, reservas e pagamentos.</p>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Tipo de operação"
        className="mb-3 grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1"
      >
        {ABAS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={aba === id}
            onClick={() => setAba(id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition-all",
              aba === id ? "bg-white font-extrabold text-indigo-600 shadow-sm" : "text-slate-500",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mb-2 text-xs font-semibold text-rose-600">{error}</p>}

      {aba === "reservas" &&
        (movimentos.length === 0 ? (
          <EmptyTab>Nenhum valor guardado ou retirado ainda.</EmptyTab>
        ) : (
          <ul className="space-y-2 border-t border-slate-100 pt-3">
            {movimentos.map((m) => {
              const isEntrada = m.tipo === "APORTE" || m.tipo === "TRANSFERENCIA_ENTRADA";
              return (
                <Row
                  key={m.id}
                  title={m.descricao ?? m.reservaNome}
                  subtitle={`${m.reservaNome} · ${formatData(m.dataReferencia)}`}
                >
                  <span
                    className={cn(
                      "tabular-nums font-bold",
                      isEntrada ? "text-indigo-600" : "text-slate-600",
                    )}
                  >
                    {isEntrada ? "+" : "−"}
                    {formatCents(m.valor)}
                  </span>
                  {m.tipo === "APORTE" && (
                    <button
                      type="button"
                      aria-label={`Desfazer aporte de ${formatCents(m.valor)}`}
                      onClick={() => setDeleteTarget({ kind: "aporte", mov: m })}
                      className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </Row>
              );
            })}
          </ul>
        ))}

      {aba === "transferencias" &&
        (transferenciasVisiveis.length === 0 ? (
          <EmptyTab>Nenhuma transferência registrada.</EmptyTab>
        ) : (
          <ul className="space-y-2 border-t border-slate-100 pt-3">
            {transferenciasVisiveis.map((t) => (
              <Row
                key={t.id}
                title={t.descricao ?? `${t.origemNome} → ${t.destinoNome}`}
                subtitle={`${t.origemNome} → ${t.destinoNome} · ${formatData(t.dataReferencia)}`}
              >
                <span className="tabular-nums font-bold text-slate-700">
                  {formatCents(t.valor)}
                </span>
                <button
                  type="button"
                  aria-label={`Desfazer transferência de ${formatCents(t.valor)}`}
                  onClick={() => setDeleteTarget({ kind: "transferencia", t })}
                  className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </Row>
            ))}
          </ul>
        ))}

      {aba === "pagamentos" &&
        (pagamentos.length === 0 ? (
          <EmptyTab>Nenhum pagamento registrado.</EmptyTab>
        ) : (
          <ul className="space-y-2 border-t border-slate-100 pt-3">
            {pagamentos.map((p) => (
              <Row
                key={p.id}
                title={
                  p.descricao ??
                  p.compromissoNome ??
                  (p.natureza === "LIQUIDACAO_FATURA" ? "Fatura do cartão" : "Conta fixa")
                }
                subtitle={`${p.contaNome} · ${formatData(p.dataReferencia)}`}
              >
                <span className="tabular-nums font-bold text-slate-600">
                  −{formatCents(p.valor)}
                </span>
                <button
                  type="button"
                  aria-label={`Desfazer pagamento de ${formatCents(p.valor)}`}
                  onClick={() => setDeleteTarget({ kind: "pagamento", p })}
                  className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </Row>
            ))}
          </ul>
        ))}

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
              {deleteTarget.kind === "aporte" && "Desfazer este aporte?"}
              {deleteTarget.kind === "transferencia" && "Desfazer esta transferência?"}
              {deleteTarget.kind === "pagamento" && "Desfazer este pagamento?"}
            </h3>
            <p className="text-sm font-medium text-slate-500">
              {deleteTarget.kind === "aporte" && (
                <>
                  Os {formatCents(deleteTarget.mov.valor)} guardados em &quot;
                  {deleteTarget.mov.reservaNome}&quot; voltam para o saldo livre.
                </>
              )}
              {deleteTarget.kind === "transferencia" && (
                <>
                  Os {formatCents(deleteTarget.t.valor)} voltam para &quot;
                  {deleteTarget.t.origemNome}&quot;.
                </>
              )}
              {deleteTarget.kind === "pagamento" && (
                <>
                  Os {formatCents(deleteTarget.p.valor)} voltam para &quot;
                  {deleteTarget.p.contaNome}&quot;, a conta reabre e a reserva é restaurada.
                </>
              )}
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
                {deleteTarget.kind === "aporte" ? "Não, Manter Guardado" : "Não, Manter"}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
};
