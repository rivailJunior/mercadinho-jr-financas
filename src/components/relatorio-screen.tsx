"use client";

import { deleteLancamento } from "@/app/actions/lancamentos";
import { DeleteLancamentoModal } from "@/components/delete-lancamento-modal";
import { MonthFilterCard } from "@/components/month-filter-card";
import { MonthlySummaryCard } from "@/components/monthly-summary-card";
import { Toast, type ToastMessage } from "@/components/toast";
import { TransactionsCard } from "@/components/transactions-card";
import { WhatsAppHelpLink } from "@/components/whatsapp-help-link";
import type { Lancamento, LancamentoFilter, MonthlyReport } from "@/types/cashClosing";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

interface RelatorioScreenProps {
  report: MonthlyReport;
}

export const RelatorioScreen = ({ report }: RelatorioScreenProps) => {
  const router = useRouter();
  const [filter, setFilter] = useState<LancamentoFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<Lancamento | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<(ToastMessage & { id: number }) | null>(null);

  const counts = useMemo(() => {
    let entradas = 0;
    for (const l of report.lancamentos) if (l.tipo === "ENTRADA") entradas += 1;
    return {
      total: report.lancamentos.length,
      entradas,
      saidas: report.lancamentos.length - entradas,
    };
  }, [report.lancamentos]);

  const filtered = useMemo(
    () =>
      filter === "all" ? report.lancamentos : report.lancamentos.filter((l) => l.tipo === filter),
    [report.lancamentos, filter],
  );

  const handleDismissToast = useCallback(() => setToast(null), []);
  const handleCancelDelete = useCallback(() => setDeleteTarget(null), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteLancamento({ id: deleteTarget.id });
      if (result.ok) {
        setDeleteTarget(null);
        setToast({ id: Date.now(), variant: "success", message: "Lançamento apagado!" });
        router.refresh();
      } else {
        setToast({
          id: Date.now(),
          variant: "error",
          message: `Erro ao apagar: ${result.error}`,
        });
      }
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, router]);

  return (
    <>
      {toast && <Toast key={toast.id} toast={toast} onDismiss={handleDismissToast} />}

      <MonthFilterCard
        mesAtual={report.mes}
        filter={filter}
        counts={counts}
        onFilterChange={setFilter}
      />

      <MonthlySummaryCard summary={report.summary} />

      <TransactionsCard
        lancamentos={filtered}
        totalCount={counts.total}
        onDelete={setDeleteTarget}
      />

      <WhatsAppHelpLink />

      <DeleteLancamentoModal
        lancamento={deleteTarget}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
};
