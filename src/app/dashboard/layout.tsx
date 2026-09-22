import { auth, signOut } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "EXECUTIVO";
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const nome = session?.user?.name ?? session?.user?.email ?? "";

  const notificacoesNaoLidas = userId
    ? await prisma.notification.count({ where: { userId, lida: false } })
    : 0;

  const somenteAntigo = role === "ADMIN" || role === "GESTOR" || role === "EXECUTIVO";

  const links = [
    { href: "/dashboard", label: "Visão geral", show: role === "ADMIN" || role === "GESTOR" },
    { href: "/dashboard/lancamento", label: "Lançar dados", show: somenteAntigo },
    { href: "/dashboard/meus-numeros", label: "Meus números", show: somenteAntigo },
    { href: "/dashboard/gestor", label: "Painel do gestor", show: role === "ADMIN" || role === "GESTOR" },

    // Operação comercial simplificada — SDR / Closer / Gerente único
    { href: "/dashboard/sdr", label: "Dashboard", show: role === "SDR" },
    { href: "/dashboard/sdr/lancamento", label: "Lançamento Diário", show: role === "SDR" },
    { href: "/dashboard/sdr/lancamentos", label: "Meus Lançamentos", show: role === "SDR" },

    { href: "/dashboard/closer", label: "Dashboard", show: role === "CLOSER" },
    { href: "/dashboard/closer/lancamento", label: "Lançamento Diário", show: role === "CLOSER" },
    { href: "/dashboard/closer/lancamentos", label: "Meus Lançamentos", show: role === "CLOSER" },

    { href: "/dashboard/gerente", label: "Dashboard Geral", show: role === "ADMIN" || role === "GERENTE" },
    { href: "/dashboard/gerente/sdr", label: "Dashboard SDR", show: role === "ADMIN" || role === "GERENTE" },
    { href: "/dashboard/gerente/closer", label: "Dashboard Closer", show: role === "ADMIN" || role === "GERENTE" },
    { href: "/dashboard/gerente/relatorios", label: "Relatórios", show: role === "ADMIN" || role === "GERENTE" },
    { href: "/dashboard/gerente/equipe", label: "Equipe", show: role === "ADMIN" || role === "GERENTE" },

    // Papéis antigos do pipeline (Prospector/Closer distribuído) — mantidos só pra quem ainda estiver nesses papéis
    { href: "/dashboard/prospector", label: "Prospecção", show: role === "PROSPECTOR" },
    { href: "/dashboard/gerente-prospector", label: "Prospecção (equipe)", show: role === "GERENTE_PROSPECTOR" },
    { href: "/dashboard/gerente-sdr", label: "SDR (equipe)", show: role === "GERENTE_SDR" },
    { href: "/dashboard/gerente-closer", label: "Distribuição", show: role === "GERENTE_CLOSER" },

    { href: "/dashboard/busca", label: "Busca", show: role === "ADMIN" || role === "GERENTE" },
    { href: "/dashboard/notificacoes", label: "Notificações", show: true, badge: notificacoesNaoLidas },
    { href: "/dashboard/admin", label: "Usuários", show: role === "ADMIN" },
    { href: "/dashboard/admin/auditoria", label: "Auditoria", show: role === "ADMIN" },
  ];

  async function fazerLogout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar links={links} nome={nome} role={role} onSignOut={fazerLogout} />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-[1400px] p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
