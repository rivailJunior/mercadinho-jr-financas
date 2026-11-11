import type { ProvisaoPainel } from "@/lib/finance/data";
import { formatCents } from "@/lib/money";
import { CheckCircle, PiggyBank } from "lucide-react";

interface DailyProvisionCardProps {
  provisao: ProvisaoPainel;
}

/**
 * "Quanto guardar hoje pras contas fixas" — shows the daily provision
 * (the day's "Livre de Verdade", capped by the remaining gaps). Once
 * today's aporte is registered, it switches to the "Guardado hoje" state.
 */
export const DailyProvisionCard = ({ provisao }: DailyProvisionCardProps) => {
  const { resultado: r } = provisao;
  const jaGuardou = provisao.jaGuardouHoje;

  return (
    <section
      className="rounded-3xl border border-indigo-50/50 bg-white p-5 shadow-soft"
      aria-labelledby="provisao-title"
    >
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

      <div
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-extrabold text-white shadow-button-tap ${
          jaGuardou
            ? "bg-linear-to-r from-emerald-500 to-emerald-600"
            : "bg-linear-to-r from-blue-500 to-blue-600"
        }`}
      >
        <CheckCircle className="h-5 w-5" />
        {jaGuardou
          ? `Guardado hoje ${formatCents(provisao.guardadoHoje)}`
          : `Guardar ${formatCents(r.sugerido)} hoje`}
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-400">
        {jaGuardou
          ? "Você já guardou hoje — amanhã tem mais."
          : r.sugerido > 0
            ? `${formatCents(r.sugeridoCartao)} pro cartão · ${formatCents(r.sugeridoCompromissos)} pras outras contas · ${formatCents(r.sobraCaixa)} fica no caixa`
            : "Sem sobra hoje — nada a guardar."}
      </p>
    </section>
  );
};
