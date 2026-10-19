"use client";

import { Home, BarChart3, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = "caixa" | "relatorio" | "caderninho";

interface BottomNavProps {
  active?: NavItem;
}

const NAV_ITEMS: { id: NavItem; label: string; icon: typeof Home }[] = [
  { id: "caixa", label: "Caixa de Hoje", icon: Home },
  { id: "relatorio", label: "Relatório Mensal", icon: BarChart3 },
  { id: "caderninho", label: "Anotar Caderninho", icon: PlusCircle },
];

export const BottomNav = ({ active = "caixa" }: BottomNavProps) => {
  return (
    <nav
      className="sticky bottom-0 z-20 flex items-center justify-around border-t border-slate-100 bg-white px-6 py-3 shadow-lg"
      aria-label="Navegação principal"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === active;

        return (
          <button
            key={item.id}
            type="button"
            className={cn(
              "flex flex-col items-center gap-1",
              isActive
                ? "text-indigo-600"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            <Icon className="h-6 w-6 stroke-2" />
            <span
              className={cn(
                "text-[10px] tracking-tight",
                isActive ? "font-extrabold" : "font-bold",
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
