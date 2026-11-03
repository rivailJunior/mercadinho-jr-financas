"use client";

import { cn } from "@/lib/utils";
import { BarChart3, Home, PlusCircle } from "lucide-react";
import Link from "next/link";

type NavItem = "caixa" | "relatorio" | "caderninho";

interface BottomNavProps {
  active?: NavItem;
}

const NAV_ITEMS: { id: NavItem; label: string; icon: typeof Home; href?: string }[] = [
  { id: "caixa", label: "Caixa de Hoje", icon: Home, href: "/" },
  { id: "relatorio", label: "Relatório", icon: BarChart3, href: "/relatorio" },
  { id: "caderninho", label: "Caderninho", icon: PlusCircle },
];

const itemClass = (isActive: boolean) =>
  cn(
    "flex flex-1 flex-col items-center gap-1 py-1",
    isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600",
  );

const NavItemContent = ({
  item,
  isActive,
}: { item: (typeof NAV_ITEMS)[number]; isActive: boolean }) => {
  const Icon = item.icon;
  return (
    <>
      <Icon className="h-6 w-6 stroke-2" />
      <span className={cn("text-[10px] tracking-tight", isActive ? "font-extrabold" : "font-bold")}>
        {item.label}
      </span>
      {isActive && <span className="-mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-600" />}
    </>
  );
};

export const BottomNav = ({ active = "caixa" }: BottomNavProps) => {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-md items-center justify-around border-t border-slate-100 bg-white px-3 py-2.5 shadow-lg"
      aria-label="Navegação principal"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === active;

        return item.href ? (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={itemClass(isActive)}
          >
            <NavItemContent item={item} isActive={isActive} />
          </Link>
        ) : (
          <button key={item.id} type="button" className={itemClass(isActive)}>
            <NavItemContent item={item} isActive={isActive} />
          </button>
        );
      })}
    </nav>
  );
};
