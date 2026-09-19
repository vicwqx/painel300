import { auth, signOut } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "EXECUTIVO";
  const nome = session?.user?.name ?? session?.user?.email ?? "";

  const links = [
    { href: "/dashboard", label: "Visão geral", show: true },
    { href: "/dashboard/lancamento", label: "Lançar dados", show: true },
    { href: "/dashboard/gestor", label: "Painel do gestor", show: role === "ADMIN" || role === "GESTOR" },
    { href: "/dashboard/admin", label: "Administração", show: role === "ADMIN" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface p-4 md:flex">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber font-mono text-sm font-bold text-[#1a1200]">
            L
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Painel 300</p>
            <p className="text-[10px] uppercase tracking-wide text-muted">Loma</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {links
            .filter((l) => l.show)
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
        </nav>

        <div className="mt-auto border-t border-border pt-4">
          <p className="truncate text-xs text-muted">{nome}</p>
          <p className="mb-3 text-[10px] uppercase tracking-wide text-muted-2">{role}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="text-xs text-red hover:underline">Sair</button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
