import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { WHATSAPP_URL } from "@/constants/cashClosing";

export const WhatsAppHelpLink = () => {
  return (
    <section
      className={cn(
        "rounded-(--rounded-lg) border border-slate-200 bg-white",
        "p-(--space-md) flex flex-col gap-(--space-sm)",
      )}
      aria-labelledby="whatsapp-help-title"
    >
      <p
        id="whatsapp-help-title"
        className="text-[14px] font-medium leading-5 text-slate-700"
      >
        Ficou com dúvida em algum valor?
      </p>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center justify-center gap-2",
          "rounded-(--rounded-md) bg-green-700 px-4 py-3",
          "text-[14px] font-semibold leading-5 text-white",
          "transition-colors hover:bg-green-700/90",
          "active:scale-[0.98]",
        )}
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        Falar no WhatsApp com o filho
      </a>
    </section>
  );
};
