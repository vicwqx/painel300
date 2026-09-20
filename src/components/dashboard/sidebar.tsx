"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  UserRound,
  Users,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  Target,
  Phone,
  Handshake,
  Search,
  Bell,
  History,
} from "lucide-react";

type NavLink = { href: string; label: string; show: boolean; badge?: number };

const ICONS: Record<string, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/lancamento": ClipboardList,
  "/dashboard/meus-numeros": UserRound,
  "/dashboard/gestor": Users,
  "/dashboard/admin": ShieldCheck,
  "/dashboard/admin/auditoria": History,
  "/dashboard/prospector": Target,
  "/dashboard/gerente-prospector": Target,
  "/dashboard/sdr": Phone,
  "/dashboard/gerente-sdr": Phone,
  "/dashboard/em-breve": Handshake,
  "/dashboard/closer": Handshake,
  "/dashboard/gerente-closer": Users,
  "/dashboard/busca": Search,
  "/dashboard/notificacoes": Bell,
};

export function Sidebar({
  links,
  nome,
  role,
  onSignOut,
}: {
  links: NavLink[];
  nome: string;
  role: string;
  onSignOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const visiveis = links.filter((l) => l.show);

  const conteudoNav = (
    <>
      <div className="mb-8 flex items-center gap-2.5 px-1">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-soft">
          <span className="text-sm font-bold text-accent">L</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold leading-tight text-foreground">Painel 300</p>
          <p className="truncate text-[10px] uppercase tracking-wider text-muted-2">Loma Bem Protegido</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {visiveis.map((l) => {
          const ativo = l.href === "/dashboard" ? pathname === l.href : pathname.startsWith(l.href);
          const Icone = ICONS[l.href] ?? LayoutDashboard;
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setAberto(false)}
              className={`group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                ativo ? "text-foreground" : "text-muted hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              {ativo && <span className="absolute inset-0 rounded-md bg-surface-2" aria-hidden />}
              {ativo && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent" aria-hidden />
              )}
              <Icone size={16} strokeWidth={2} />
              <span className="relative flex-1">{l.label}</span>
              {!!l.badge && l.badge > 0 && (
                <span className="relative flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-[#04211d]">
                  {l.badge > 9 ? "9+" : l.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border pt-4">
        <div className="mb-3 flex items-center gap-2.5 px-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-3 text-xs font-semibold text-foreground">
            {nome.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-foreground">{nome}</p>
            <p className="truncate text-[11px] capitalize text-muted-2">{role.toLowerCase()}</p>
          </div>
        </div>
        <form action={onSignOut}>
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-negative">
            <LogOut size={14} />
            Sair
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft">
            <span className="text-xs font-bold text-accent">L</span>
          </div>
          <span className="text-sm font-semibold">Painel 300</span>
        </div>
        <button onClick={() => setAberto(true)} className="rounded-md p-1.5 text-muted hover:bg-surface-2">
          <Menu size={20} />
        </button>
      </div>

      {aberto && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setAberto(false)} />
          <div className="relative flex w-64 flex-col bg-surface p-4">
            <button
              onClick={() => setAberto(false)}
              className="absolute right-3 top-3 rounded-md p-1 text-muted hover:bg-surface-2"
            >
              <X size={18} />
            </button>
            {conteudoNav}
          </div>
        </div>
      )}

      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface p-4 md:flex">
        {conteudoNav}
      </aside>
    </>
  );
}
