"use client";

import { guardarParaFixas } from "@/app/actions/financeiro";
import { Toast, type ToastMessage } from "@/components/toast";
import type { ProvisaoPainel } from "@/lib/finance/data";
import { formatCents } from "@/lib/money";
import { CheckCircle, PiggyBank } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DailyProvisionCardProps {
  provisao: ProvisaoPainel;
}

const Line = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="font-bold tabular-nums text-slate-800">{value}</span>
  </div>
);

/**
 * "Quanto guardar hoje pras contas fixas" — shows the daily provision
 * (85% of the day's profit, capped by the remaining gaps) and applies it
 * with one tap.
 */
export const DailyProvisionCard = ({ provisao }: DailyProvisionCardProps) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<(ToastMessage & { id: number }) | null>(null);
  const { resultado: r } = provisao;

  const handleGuardar = async () => {
    setIsSaving(true);
    const result = await guardarParaFixas();
    setIsSaving(false);
    if (result.ok) {
      setToast({ id: Date.now(), variant: "success", message: "Reserva diária guardada!" });
      router.refresh();
    } else {
      setToast({ id: Date.now(), variant: "error", message: result.error ?? "Falha ao guardar." });
    }
  };

  return (
    <section
      className="rounded-3xl border border-indigo-50/50 bg-white p-5 shadow-soft"
      aria-labelledby="provisao-title"
    >
      {toast && <Toast key={toast.id} toast={toast} onDismiss={() => setToast(null)} />}

      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <PiggyBank className="h-5 w-5" />
        </span>
        <div>
          <h2 id="provisao-title" className="text-base font-bold text-slate-700">
            Quanto guardar hoje
          </h2>
          <p className="text-[11px] text-slate-400">Para as contas fixas do mês</p>
        </div>
      </div>

      <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
        <Line label="Falta pro cartão" value={formatCents(provisao.faltaCartao)} />
        <Line label="Falta pras outras contas" value={formatCents(provisao.faltaCompromissos)} />
        <Line label="Ritmo necessário por dia" value={formatCents(r.ritmoTotal)} />
        <Line label="Livre de verdade hoje" value={formatCents(r.disponivel)} />
      </div>

      <button
        type="button"
        onClick={handleGuardar}
        disabled={isSaving || r.sugerido <= 0}
        className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-indigo-500 to-violet-500 px-6 py-4 text-base font-extrabold text-white shadow-button-tap transition-all duration-150 hover:from-indigo-600 hover:to-violet-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CheckCircle className="h-5 w-5" />
        {isSaving ? "Guardando..." : `Guardar ${formatCents(r.sugerido)} hoje`}
      </button>
      <p className="mt-2 text-center text-[11px] text-slate-400">
        {provisao.jaGuardouHoje
          ? "Você já guardou hoje — amanhã tem mais."
          : r.sugerido > 0
            ? `${formatCents(r.sugeridoCartao)} pro cartão · ${formatCents(r.sugeridoCompromissos)} pras outras contas · ${formatCents(r.sobraCaixa)} fica no caixa`
            : "Sem sobra hoje — nada a guardar."}
      </p>
    </section>
  );
};
