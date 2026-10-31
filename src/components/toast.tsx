"use client";

import { cn } from "@/lib/utils";
import { CircleCheck, CircleX } from "lucide-react";
import { useEffect, useState } from "react";

export interface ToastMessage {
  variant: "success" | "error";
  message: string;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: () => void;
  /** How long the toast stays visible before sliding back out (ms). */
  visibleMs?: number;
}

/** Render with a `key` that changes per toast so each one gets a fresh timer. */
export const Toast = ({ toast, onDismiss, visibleMs = 2500 }: ToastProps) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLeaving(true), visibleMs);
    return () => clearTimeout(timer);
  }, [visibleMs]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <output
        onAnimationEnd={() => {
          if (leaving) onDismiss();
        }}
        className={cn(
          "flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold text-white shadow-lg",
          leaving ? "animate-toast-out" : "animate-toast-in",
          toast.variant === "success" ? "bg-emerald-500" : "bg-rose-500",
        )}
      >
        {toast.variant === "success" ? (
          <CircleCheck className="h-5 w-5" aria-hidden="true" />
        ) : (
          <CircleX className="h-5 w-5" aria-hidden="true" />
        )}
        <span>{toast.message}</span>
      </output>
    </div>
  );
};
