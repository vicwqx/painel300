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

  const gerentes = ["GERENTE_PROSPECTOR", "GERENTE_SDR", "GERENTE_CLOSER"];

  const links = [
    { href: "/dashboard", label: "Visão geral", show: role === "ADMIN" || role === "GESTOR" },
    { href: "/dashboard/lancamento", label: "Lançar dados", show: somenteAntigo },
    { href: "/dashboard/meus-numeros", label: "Meus números", show: somenteAntigo },
    { href: "/dashboard/gestor", label: "Painel do gestor", show: role === "ADMIN" || role === "GESTOR" },
    { href: "/dashboard/prospector", label: "Prospecção", show: role === "ADMIN" || role === "PROSPECTOR" },
    { href: "/dashboard/gerente-prospector", label: "Prospecção (equipe)", show: role === "ADMIN" || role === "GERENTE_PROSPECTOR" },
    { href: "/dashboard/sdr", label: "Fila de SDR", show: role === "ADMIN" || role === "SDR" },
    { href: "/dashboard/gerente-sdr", label: "SDR (equipe)", show: role === "ADMIN" || role === "GERENTE_SDR" },
    { href: "/dashboard/closer", label: "Meus leads", show: role === "ADMIN" || role === "CLOSER" },
    { href: "/dashboard/gerente-closer", label: "Distribuição", show: role === "ADMIN" || role === "GERENTE_CLOSER" },
    { href: "/dashboard/busca", label: "Busca", show: role === "ADMIN" || gerentes.includes(role) },
    { href: "/dashboard/notificacoes", label: "Notificações", show: true, badge: notificacoesNaoLidas },
    { href: "/dashboard/admin", label: "Administração", show: role === "ADMIN" },
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
