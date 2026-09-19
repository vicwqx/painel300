import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Regras de acesso por prefixo de rota. Quem não bate nenhuma regra abaixo
// só precisa estar autenticado (qualquer cargo).
const REGRAS_POR_PREFIXO: { prefixo: string; papeisPermitidos: string[] }[] = [
  { prefixo: "/dashboard/admin", papeisPermitidos: ["ADMIN"] },
  { prefixo: "/dashboard/gestor", papeisPermitidos: ["ADMIN", "GESTOR"] },
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
  const regra = REGRAS_POR_PREFIXO.find((r) => pathname.startsWith(r.prefixo));
  if (regra && !regra.papeisPermitidos.includes(papel)) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
