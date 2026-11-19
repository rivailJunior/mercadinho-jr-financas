import { SummaryCardItem } from "@/components/summary-card-item";
import type { PainelFinanceiro } from "@/lib/finance/data";
import { formatCents } from "@/lib/money";
import { BadgePercent, CalendarClock, Landmark, PiggyBank, Wallet } from "lucide-react";

interface FinancialDashboardProps {
  painel: PainelFinanceiro;
}

export const FinancialDashboard = ({ painel }: FinancialDashboardProps) => {
  const { posicao, contas, reservas, compromissos, adiantadoFixas } = painel;

  const contaTon = painel.contas.filter((item) => {
    if (item.tipo === "BANCO") {
      return item;
    }
  })?.[0]?.saldoAtual;

  // Reserves with nothing saved and no linked obligation have nothing to
  // show — hide them so the "Adiantado" line can take their place.
  const reservasVisiveis = reservas.filter((r) => r.valorAtual > 0 || r.metaEfetiva != null);
  const livre = posicao.saldoLivre;
  const contasFixas = [...compromissos].sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  const totalPrevisto = contasFixas.reduce(
    (acc, c) => acc + (c.valorEfetivo ?? c.valorPrevisto),
    0,
  );

  const totalArrecadado = contasFixas.reduce((acc, c) => acc + c.valorReservado + c.valorPago, 0);

  const saldoComercio = contaTon ?? 0;
  const pctAtingido = totalPrevisto > 0 ? saldoComercio / totalPrevisto : 0;
  const faltaComercio = Math.max(0, totalPrevisto - saldoComercio);

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

        {/* Onde o dinheiro está */}
        <section
          aria-labelledby="contas-title"
          className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft mb-6 bg-red-500"
        >
          <div className="mb-3 flex items-center gap-3 ">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 id="contas-title" className="text-sm font-extrabold leading-snug text-slate-800">
              Onde está o dinheiro?
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

        <div className="grid grid-cols-2 gap-3.5">
          <SummaryCardItem
            label="Saldo Total"
            value={posicao.saldoConsolidado / 100}
            subtitle="Saldo dia + Reservado"
            bgColor="bg-brand-blue"
            labelColor="text-blue-100"
            subtitleColor="text-blue-200"
            shadowClass="shadow-card-blue"
            icon={Landmark}
          />
          <SummaryCardItem
            label="Total Reservado"
            value={saldoComercio / 100}
            subtitle="Conta Ton"
            bgColor="bg-brand-blue"
            labelColor="text-indigo-100"
            subtitleColor="text-indigo-200"
            shadowClass="shadow-card-purple"
            icon={PiggyBank}
          />
          <div className="col-span-2">
            <SummaryCardItem
              label="Saldo livre do dia"
              value={livre / 100}
              subtitle="Caixa Fisico + Maquininha"
              bgColor={livre >= 0 ? "bg-brand-mint" : "bg-brand-coral"}
              labelColor={livre >= 0 ? "text-emerald-100" : "text-rose-100"}
              subtitleColor={livre >= 0 ? "text-emerald-100" : "text-rose-200"}
              shadowClass={livre >= 0 ? "shadow-card-mint" : "shadow-card-coral"}
              icon={Wallet}
            />
          </div>
          <div className="col-span-2">
            <SummaryCardItem
              label="Atingido do mês"
              value={pctAtingido}
              subtitle={`Faltam ${formatCents(faltaComercio)} para alcançar ${formatCents(totalPrevisto)}`}
              bgColor="bg-brand-blue"
              labelColor="text-indigo-100"
              subtitleColor="text-indigo-200"
              shadowClass="shadow-card-purple"
              icon={BadgePercent}
              formatValue={(v) => `${Math.round(v * 100)}%`}
            />
          </div>
        </div>
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
            Total Reservado - Conta Ton
          </h3>
        </div>
        <ul className="space-y-3 border-t border-slate-100 pt-3">
          {reservasVisiveis.length === 0 && adiantadoFixas <= 0 && (
            <li className="py-1 text-xs text-slate-500">Nenhuma reserva configurada.</li>
          )}
          {reservasVisiveis.map((r) => {
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
          {adiantadoFixas > 0 && (
            <li className="text-xs">
              <div className="flex items-center justify-between py-0.5">
                <span className="font-medium text-slate-600">Adiantado</span>
                <span className="tabular-nums font-bold text-slate-800">
                  {formatCents(adiantadoFixas)}
                </span>
              </div>
              <span className="mt-0.5 block text-[11px] text-slate-400">
                Guardado além do ritmo diário — pode cobrir qualquer conta fixa abaixo
              </span>
            </li>
          )}
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
          {contasFixas.length === 0 && (
            <li className="py-1 text-xs text-slate-500">Nenhuma conta fixa cadastrada.</li>
          )}
          {contasFixas.map((c) => {
            const total = c.valorEfetivo ?? c.valorPrevisto;
            return (
              <li key={c.id} className="text-xs">
                <div className="flex items-center justify-between py-0.5">
                  <span className="font-medium text-slate-600">{c.nome}</span>
                  <span className="tabular-nums font-bold text-slate-800">
                    {formatCents(total)}
                  </span>
                </div>
                <div className="flex items-center justify-between font-normal text-slate-400">
                  {c.vencimento ? (
                    <span>
                      vence {c.vencimento.slice(8, 10)}/{c.vencimento.slice(5, 7)}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="tabular-nums">{formatCents(Math.round(total / 30))}/dia</span>
                </div>
              </li>
            );
          })}
        </ul>
        {contasFixas.length > 0 && (
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="font-medium text-slate-500">Total do mês</span>
            <span className="tabular-nums font-bold text-slate-800">
              {formatCents(totalArrecadado)}
              <span className="font-normal text-slate-400"> de </span>
              {formatCents(totalPrevisto)}
            </span>
          </div>
        )}
      </section>
    </div>
  );
};
