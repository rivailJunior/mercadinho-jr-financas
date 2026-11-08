"use client";

import { signIn } from "@/app/login/actions";
import { Toast, type ToastMessage } from "@/components/toast";
import { Eye, EyeOff, Lock, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass =
  "w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white";

export const LoginForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<(ToastMessage & { id: number }) | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const result = await signIn({ email: email.trim(), password });
    setIsSaving(false);
    if (result.ok) {
      router.replace("/");
      router.refresh();
    } else {
      setToast({ id: Date.now(), variant: "error", message: result.error ?? "Falha no login." });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-soft"
    >
      <div className="flex flex-col items-center gap-2 pt-2">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Store className="h-7 w-7" />
        </span>
        <h1 className="text-xl font-bold text-slate-900">Mercadinho JR</h1>
        <p className="text-sm text-slate-500">Entre para acessar o financeiro</p>
      </div>

      <div className="space-y-1.5">
        <span className="block text-xs font-bold uppercase tracking-wide text-slate-600">
          E-mail
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="voce@email.com"
        />
      </div>

      <div className="space-y-1.5">
        <span className="block text-xs font-bold uppercase tracking-wide text-slate-600">
          Senha
        </span>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pr-12`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-60"
      >
        <Lock className="h-4 w-4" />
        {isSaving ? "Entrando…" : "Entrar"}
      </button>

      {toast && <Toast key={toast.id} toast={toast} onDismiss={() => setToast(null)} />}
    </form>
  );
};
