import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CriarUsuarioForm } from "./form";
import { AtivoToggle } from "./ativo-toggle";
import Link from "next/link";

export default async function AdminPage() {
  const usuarios = await prisma.user.findMany({
    include: { profile: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Administração</h1>
        <p className="text-sm text-muted">Cadastro de usuários e permissões.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log de lançamentos</CardTitle>
          <CardDescription>Auditoria completa — quando cada lançamento foi feito, e opção de apagar.</CardDescription>
        </CardHeader>
        <Link href="/dashboard/admin/lancamentos" className="text-sm font-semibold text-amber hover:underline">
          Ver log de lançamentos →
        </Link>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Novo usuário</CardTitle>
          <CardDescription>Cria login e perfil operacional de uma vez.</CardDescription>
        </CardHeader>
        <CriarUsuarioForm />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários cadastrados</CardTitle>
        </CardHeader>
        <div className="divide-y divide-border">
          {usuarios.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-2.5">
              <span className="flex-1 text-sm font-medium">
                {u.profile ? (
                  <Link href={`/dashboard/vendedor/${u.profile.id}`} className="hover:text-amber hover:underline">
                    {u.profile.nome}
                  </Link>
                ) : (
                  u.email
                )}
              </span>
              <span className="text-xs text-muted">{u.email}</span>
              <Badge tone="neutral">{u.profile?.cargo ?? "-"}</Badge>
              <Badge tone={u.role === "ADMIN" ? "amber" : u.role === "GESTOR" ? "teal" : "neutral"}>
                {u.role}
              </Badge>
              {u.profile && <AtivoToggle profileId={u.profile.id} ativoInicial={u.profile.ativo} />}
            </div>
          ))}
          {usuarios.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">Nenhum usuário cadastrado.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
