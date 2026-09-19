import { auth, signOut } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "EXECUTIVO";
  const nome = session?.user?.name ?? session?.user?.email ?? "";

  const somenteAntigo = role === "ADMIN" || role === "GESTOR" || role === "EXECUTIVO";

  const links = [
    { href: "/dashboard", label: "Visão geral", show: role === "ADMIN" || role === "GESTOR" },
    { href: "/dashboard/lancamento", label: "Lançar dados", show: somenteAntigo },
    { href: "/dashboard/meus-numeros", label: "Meus números", show: somenteAntigo },
    { href: "/dashboard/gestor", label: "Painel do gestor", show: role === "ADMIN" || role === "GESTOR" },
    { href: "/dashboard/prospector", label: "Prospecção", show: role === "ADMIN" || role === "PROSPECTOR" || role === "GERENTE_PROSPECTOR" },
    { href: "/dashboard/sdr", label: "Fila de SDR", show: role === "ADMIN" || role === "SDR" || role === "GERENTE_SDR" },
    { href: "/dashboard/em-breve", label: "Closer", show: role === "CLOSER" || role === "GERENTE_CLOSER" },
    { href: "/dashboard/admin", label: "Administração", show: role === "ADMIN" },
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
