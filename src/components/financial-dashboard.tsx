import type { PainelFinanceiro } from "@/lib/finance/data";
import { formatCents } from "@/lib/money";
import { AlertTriangle, PiggyBank, TrendingUp, Wallet } from "lucide-react";

interface FinancialDashboardProps {
  painel: PainelFinanceiro;
}

const Stat = ({ label, value, accent }: { label: string; value: number; accent: string }) => (
  <article className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-4 shadow-soft">
    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
    <p className={`tabular-nums mt-2 text-xl font-black leading-none ${accent}`}>
      {formatCents(value)}
    </p>
  </article>
);

export const FinancialDashboard = ({ painel }: FinancialDashboardProps) => {
  const { posicao, contas, reservas, caixaMinimo, recomendacao } = painel;
  const livre = posicao.saldoLivre;
  const abaixoDoMinimo = recomendacao.abaixoDoMinimo;

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
          <Stat
            label="Saldo consolidado"
            value={posicao.saldoConsolidado}
            accent="text-slate-800"
          />
          <Stat label="Total reservado" value={posicao.totalReservado} accent="text-indigo-600" />
          <Stat
            label="Saldo livre"
            value={livre}
            accent={livre >= 0 ? "text-emerald-600" : "text-rose-600"}
          />
          <Stat label="Caixa mínimo" value={caixaMinimo} accent="text-slate-500" />
        </div>
        {abaixoDoMinimo && (
          <p className="mt-3 flex items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Caixa abaixo do mínimo operacional — não recomende novas reservas hoje.
          </p>
        )}
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
            const falta = r.meta != null ? Math.max(0, r.meta - r.valorAtual) : null;
            const progresso = r.meta && r.meta > 0 ? Math.min(1, r.valorAtual / r.meta) : null;
            return (
              <li key={r.id} className="text-xs">
                <div className="flex items-center justify-between py-0.5">
                  <span className="font-medium text-slate-600">{r.nome}</span>
                  <span className="tabular-nums font-bold text-slate-800">
                    {formatCents(r.valorAtual)}
                    {r.meta != null && (
                      <span className="font-normal text-slate-400"> / {formatCents(r.meta)}</span>
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

      {/* Recomendação de alocação */}
      <section
        aria-labelledby="recomendacao-title"
        className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft"
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3
              id="recomendacao-title"
              className="text-sm font-extrabold leading-snug text-slate-800"
            >
              Alocação recomendada hoje
            </h3>
            <p className="text-xs text-slate-500">Dinâmica — não é uma retirada fixa.</p>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Pode reservar
          </span>
          <span className="tabular-nums text-xl font-black text-emerald-700">
            {formatCents(recomendacao.totalRecomendado)}
          </span>
        </div>
        {recomendacao.totalRecomendado > 0 && (
          <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            {recomendacao.itens
              .filter((i) => i.recomendado > 0)
              .map((i) => (
                <li key={i.id} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">{i.nome}</span>
                  <span className="tabular-nums font-bold text-emerald-600">
                    {formatCents(i.recomendado)}
                  </span>
                </li>
              ))}
          </ul>
        )}
        <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
          Manter disponível no caixa:{" "}
          <span className="font-bold text-slate-600">
            {formatCents(recomendacao.manterDisponivel)}
          </span>
        </p>
      </section>
    </div>
  );
};
