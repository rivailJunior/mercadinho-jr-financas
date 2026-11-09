"use client";

import { signOut } from "@/app/login/actions";
import { LogOut } from "lucide-react";

export const LogoutButton = () => (
  <button
    type="button"
    onClick={() => signOut()}
    aria-label="Sair da conta"
    title="Sair"
    className="rounded-full p-2 text-slate-300 transition-colors hover:bg-slate-50 hover:text-slate-500"
  >
    <LogOut className="h-4 w-4" />
  </button>
);
