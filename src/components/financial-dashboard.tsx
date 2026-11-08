import { SummaryCardItem } from "@/components/summary-card-item";
import type { PainelFinanceiro } from "@/lib/finance/data";
import { formatCents } from "@/lib/money";
import { CalendarClock, Landmark, PiggyBank, Wallet } from "lucide-react";

interface FinancialDashboardProps {
  painel: PainelFinanceiro;
}

const STATUS_COMPROMISSO: Record<string, { label: string; accent: string }> = {
  PENDENTE: { label: "Pendente", accent: "text-slate-400" },
  PARCIALMENTE_RESERVADO: { label: "Reservando", accent: "text-indigo-500" },
  RESERVADO: { label: "Reservado", accent: "text-indigo-600" },
  PARCIALMENTE_PAGO: { label: "Parcial", accent: "text-amber-600" },
  PAGO: { label: "Pago", accent: "text-emerald-600" },
  VENCIDO: { label: "Vencido", accent: "text-rose-600" },
};

export const FinancialDashboard = ({ painel }: FinancialDashboardProps) => {
  const { posicao, contas, reservas, compromissos } = painel;
  const livre = posicao.saldoLivre;

  return (
    <div className="space-y-6">
      {/* Posição consolidada */}
      <section aria-labelledby="posicao-title">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="posicao-title"
            className="text-sm font-bold uppercase tracking-wider text-slate-500"
          >
            Posição Financeira
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <SummaryCardItem
            label="Saldo consolidado"
            value={posicao.saldoConsolidado / 100}
            subtitle="Soma de todas as contas"
            bgColor="bg-brand-blue"
            labelColor="text-blue-100"
            subtitleColor="text-blue-200"
            barColor="bg-blue-300/40"
            shadowClass="shadow-card-blue"
            icon={Landmark}
          />
          <SummaryCardItem
            label="Total reservado"
            value={posicao.totalReservado / 100}
            subtitle="Guardado nos envelopes"
            bgColor="bg-brand-deep-purple"
            labelColor="text-indigo-100"
            subtitleColor="text-indigo-200"
            barColor="bg-indigo-300/40"
            shadowClass="shadow-card-purple"
            icon={PiggyBank}
          />
          <div className="col-span-2">
            <SummaryCardItem
              label="Saldo livre"
              value={livre / 100}
              subtitle="Disponível pra operar"
              bgColor={livre >= 0 ? "bg-brand-mint" : "bg-brand-coral"}
              labelColor={livre >= 0 ? "text-emerald-100" : "text-rose-100"}
              subtitleColor={livre >= 0 ? "text-emerald-100" : "text-rose-200"}
              barColor={livre >= 0 ? "bg-emerald-300/40" : "bg-rose-300/40"}
              shadowClass={livre >= 0 ? "shadow-card-mint" : "shadow-card-coral"}
              icon={Wallet}
            />
          </div>
        </div>
      </section>

      {/* Onde o dinheiro está */}
      <section
        aria-labelledby="contas-title"
        className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft"
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 id="contas-title" className="text-sm font-extrabold leading-snug text-slate-800">
            Onde está o dinheiro
          </h3>
        </div>
        <ul className="space-y-2.5 border-t border-slate-100 pt-2">
          {contas.length === 0 && (
            <li className="py-1 text-xs text-slate-500">
              Nenhuma conta cadastrada. Configure caixa físico e maquininha.
            </li>
          )}
          {contas.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-1 text-xs">
              <span className="font-medium text-slate-600">{c.nome}</span>
              <span className="tabular-nums font-bold text-slate-800">
                {formatCents(c.saldoAtual)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Reservas / envelopes */}
      <section
        aria-labelledby="reservas-title"
        className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft"
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
            <PiggyBank className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 id="reservas-title" className="text-sm font-extrabold leading-snug text-slate-800">
            Reservas
          </h3>
        </div>
        <ul className="space-y-3 border-t border-slate-100 pt-3">
          {reservas.length === 0 && (
            <li className="py-1 text-xs text-slate-500">Nenhuma reserva configurada.</li>
          )}
          {reservas.map((r) => {
            const falta = r.metaEfetiva != null ? Math.max(0, r.metaEfetiva - r.valorAtual) : null;
            const progresso =
              r.metaEfetiva && r.metaEfetiva > 0 ? Math.min(1, r.valorAtual / r.metaEfetiva) : null;
            return (
              <li key={r.id} className="text-xs">
                <div className="flex items-center justify-between py-0.5">
                  <span className="font-medium text-slate-600">{r.nome}</span>
                  <span className="tabular-nums font-bold text-slate-800">
                    {formatCents(r.valorAtual)}
                    {r.metaEfetiva != null && (
                      <span className="font-normal text-slate-400">
                        {" "}
                        / {formatCents(r.metaEfetiva)}
                      </span>
                    )}
                  </span>
                </div>
                {progresso != null && (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${progresso * 100}%` }}
                    />
                  </div>
                )}
                {falta != null && falta > 0 && (
                  <span className="mt-0.5 block text-[11px] text-slate-400">
                    Falta {formatCents(falta)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Contas fixas do mês */}
      <section
        aria-labelledby="compromissos-title"
        className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft"
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <CalendarClock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3
              id="compromissos-title"
              className="text-sm font-extrabold leading-snug text-slate-800"
            >
              Contas fixas do mês
            </h3>
            <p className="text-xs text-slate-500">Cada conta tem seu dia de vencimento.</p>
          </div>
        </div>
        <ul className="space-y-3 border-t border-slate-100 pt-3">
          {compromissos.length === 0 && (
            <li className="py-1 text-xs text-slate-500">Nenhuma conta fixa cadastrada.</li>
          )}
          {compromissos.map((c) => {
            const total = c.valorEfetivo ?? c.valorPrevisto;
            const falta = Math.max(0, total - c.valorReservado - c.valorPago);
            const st = STATUS_COMPROMISSO[c.status] ?? STATUS_COMPROMISSO.PENDENTE;
            return (
              <li key={c.id} className="text-xs">
                <div className="flex items-center justify-between py-0.5">
                  <span className="font-medium text-slate-600">{c.nome}</span>
                  <span className="tabular-nums font-bold text-slate-800">
                    {formatCents(total)}
                  </span>
                </div>
                <div>
                  {c.vencimento && (
                    <span className="font-normal text-slate-400">
                      vence {c.vencimento.slice(8, 10)}/{c.vencimento.slice(5, 7)}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[11px]">
                  <span className={`font-bold ${st.accent}`}>
                    {st.label}

                  </span>
                  {falta > 0 ? (
                    <span className="text-slate-400">
                      {c.valorReservado > 0 && `${formatCents(c.valorReservado)} reservado · `}
                      Falta {formatCents(falta)}
                    </span>
                  ) : (
                    <span className="text-emerald-600">Coberto</span>
                  )}
                </div>

              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};
