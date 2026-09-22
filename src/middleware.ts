import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { rotaPadraoDoPapel } from "@/lib/rotas";

// Regras de acesso. "exato" compara igualdade estrita; sem isso, compara prefixo.
// Quem não bate nenhuma regra abaixo só precisa estar autenticado (qualquer cargo).
const REGRAS: { prefixo: string; exato?: boolean; papeisPermitidos: string[] }[] = [
  { prefixo: "/dashboard", exato: true, papeisPermitidos: ["ADMIN", "GESTOR"] },
  { prefixo: "/dashboard/admin", papeisPermitidos: ["ADMIN"] },
  { prefixo: "/dashboard/gestor", papeisPermitidos: ["ADMIN", "GESTOR"] },
  { prefixo: "/dashboard/vendedor", papeisPermitidos: ["ADMIN", "GESTOR"] },
  { prefixo: "/dashboard/prospector", papeisPermitidos: ["ADMIN", "PROSPECTOR", "GERENTE_PROSPECTOR"] },
  { prefixo: "/dashboard/gerente-prospector", papeisPermitidos: ["ADMIN", "GERENTE_PROSPECTOR"] },
  { prefixo: "/dashboard/sdr", papeisPermitidos: ["ADMIN", "SDR", "GERENTE_SDR"] },
  { prefixo: "/dashboard/gerente-sdr", papeisPermitidos: ["ADMIN", "GERENTE_SDR"] },
  { prefixo: "/dashboard/closer", papeisPermitidos: ["ADMIN", "CLOSER"] },
  { prefixo: "/dashboard/gerente-closer", papeisPermitidos: ["ADMIN", "GERENTE_CLOSER"] },
  { prefixo: "/dashboard/gerente", exato: true, papeisPermitidos: ["ADMIN", "GERENTE"] },
  { prefixo: "/dashboard/gerente/", papeisPermitidos: ["ADMIN", "GERENTE"] },
];


export default auth((req) => {
  const { pathname } = req.nextUrl;
  const estaLogado = !!req.auth;

  const rotaPublica = pathname === "/login" || pathname.startsWith("/api/auth");
  if (rotaPublica) return NextResponse.next();

  if (!estaLogado) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const papel = (req.auth?.user as { role?: string } | undefined)?.role ?? "EXECUTIVO";
  const regra = REGRAS.find((r) => (r.exato ? pathname === r.prefixo : pathname.startsWith(r.prefixo)));
  if (regra && !regra.papeisPermitidos.includes(papel)) {
    // Redireciona pra área padrão do próprio papel — nunca de volta pra "/dashboard"
    // genérico, que criaria loop pra quem não é Admin/Gestor.
    return NextResponse.redirect(new URL(rotaPadraoDoPapel(papel), req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
