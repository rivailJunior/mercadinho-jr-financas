import { PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  FIXED_EXPENSES,
  TOTAL_RESERVA_DIARIA,
} from "@/constants/cashClosing";

export const FixedExpenseReserve = () => {
  return (
    <section
      className={cn(
        "rounded-(--rounded-lg) border border-slate-200 bg-white",
        "p-(--space-md) flex flex-col gap-(--space-md)",
      )}
      aria-labelledby="fixed-reserve-title"
    >
      <div className="flex items-center gap-(--space-sm)">
        <div className="flex h-10 w-10 items-center justify-center rounded-(--rounded-md) bg-amber-50">
          <PiggyBank className="h-5 w-5 text-amber-700" aria-hidden="true" />
        </div>
        <div>
          <h2
            id="fixed-reserve-title"
            className="text-[18px] font-semibold leading-6.5 text-slate-900"
          >
            Reserva Diária das Contas Fixas
          </h2>
          <p className="text-[14px] leading-5 text-slate-500">
            Guardando todo dia, no final do mês não falta nada!
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-(--rounded-md) border border-slate-200">
        <table className="w-full text-left" aria-label="Contas fixas com reserva diária">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2.5 text-[11px] font-bold uppercase leading-3.5 tracking-[0.04em] text-slate-500">
                Conta
              </th>
              <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase leading-3.5 tracking-[0.04em] text-slate-500">
                Mensal
              </th>
              <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase leading-3.5 tracking-[0.04em] text-slate-500">
                Por Dia
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {FIXED_EXPENSES.map((expense) => (
              <tr key={expense.nome} className="transition-colors hover:bg-slate-50">
                <td className="px-3 py-2.5 text-[14px] font-medium leading-5 text-slate-700">
                  {expense.nome}
                </td>
                <td className="tabular-nums px-3 py-2.5 text-right text-[14px] leading-5 text-slate-500">
                  {formatCurrency(expense.valorMensal)}
                </td>
                <td className="tabular-nums px-3 py-2.5 text-right text-[14px] font-semibold leading-5 text-amber-700">
                  {formatCurrency(expense.reservaDiaria)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-amber-50">
              <td className="px-3 py-3 text-[14px] font-bold leading-5 text-slate-900">
                Total Diário
              </td>
              <td />
              <td className="tabular-nums px-3 py-3 text-right text-[16px] font-bold leading-6 text-amber-700">
                {formatCurrency(TOTAL_RESERVA_DIARIA)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};
