import {
  BottomNav,
  FinancialActions,
  FinancialDashboard,
  GreetingHeader,
  ReserveMovementsCard,
} from "@/components";
import { getPainelFinanceiro } from "@/lib/finance/data";

export const dynamic = "force-dynamic";

export default async function FinancasPage() {
  const painel = await getPainelFinanceiro();

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-app-bg pb-24 shadow-2xl">
      <GreetingHeader />

      <div className="flex-1 space-y-6 px-5 pt-5 pb-6">
        {painel ? (
          <>
            <FinancialDashboard painel={painel} />
            <FinancialActions
              contas={painel.contas}
              reservas={painel.reservas}
              faturas={painel.faturas}
              compromissos={painel.compromissos}
            />
            <ReserveMovementsCard movimentos={painel.movimentosReserva} />
          </>
        ) : (
          <p className="rounded-3xl border border-slate-100 bg-white p-5 text-sm text-slate-500 shadow-soft">
            Não foi possível carregar a posição financeira. Verifique o estabelecimento.
          </p>
        )}
      </div>

      <BottomNav active="financas" />
    </main>
  );
}
