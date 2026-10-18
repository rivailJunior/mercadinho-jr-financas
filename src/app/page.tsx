import {
  GreetingHeader,
  FechamentoCaixaForm,
  FixedExpenseReserve,
  WeeklyChart,
  WhatsAppHelpLink,
  RetroactiveEntryCard,
} from '@/components';

export default function Home() {
  return (
    <main className='mx-auto min-h-screen max-w-md px-(--margin) py-(--space-xl)'>
      <div className='flex flex-col gap-(--space-md)'>
        <GreetingHeader />
        <FechamentoCaixaForm />
        <FixedExpenseReserve />
        <WeeklyChart />
        <WhatsAppHelpLink />
        <RetroactiveEntryCard />
      </div>
    </main>
  );
}
