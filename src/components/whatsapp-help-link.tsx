import { ChevronRight, MessageCircle } from 'lucide-react';
import { WHATSAPP_URL } from '@/constants/cashClosing';

export const WhatsAppHelpLink = () => {
  return (
    <section className='pb-2' aria-label='Suporte familiar'>
      <a
        href={WHATSAPP_URL}
        target='_blank'
        rel='noopener noreferrer'
        className='flex items-center justify-between rounded-2xl border-2 border-emerald-200/80 bg-emerald-50 p-4 transition-colors active:bg-emerald-100'
      >
        <div className='flex items-center gap-3'>
          <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm'>
            <MessageCircle className='h-6 w-6' aria-hidden='true' />
          </div>
          <div>
            <p className='text-xs font-bold text-emerald-950'>
              Ficou com dúvida em algum valor?
            </p>
            <p className='text-[11px] font-semibold text-emerald-700'>
              Falar no WhatsApp com o filho
            </p>
          </div>
        </div>
        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-emerald-200 text-emerald-800'>
          <ChevronRight className='h-4 w-4' aria-hidden='true' />
        </div>
      </a>
    </section>
  );
};
