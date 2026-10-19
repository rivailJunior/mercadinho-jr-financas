import {
  FechamentoCaixaForm,
  FixedExpenseReserve,
  WeeklyChart,
  WhatsAppHelpLink,
  BottomNav,
} from '@/components';

export default function Home() {
  return (
    <main className='relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-app-bg pb-14 shadow-2xl'>
      <FechamentoCaixaForm />

      <div className='flex-1 space-y-6 px-5 pb-6'>
        <FixedExpenseReserve />
        <WeeklyChart />
        <WhatsAppHelpLink />
      </div>

      <BottomNav />
    </main>
  );
}
