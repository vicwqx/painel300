import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  const usuarios = await prisma.user.findMany({
    include: { profile: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Administração</h1>
        <p className="text-sm text-muted">Usuários e permissões.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários cadastrados</CardTitle>
          <CardDescription>
            Criação/edição de usuário pela interface entra na próxima etapa — por enquanto,
            gerencie via <code>npx prisma studio</code> ou pelo seed.
          </CardDescription>
        </CardHeader>
        <div className="divide-y divide-border">
          {usuarios.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-2.5">
              <span className="flex-1 text-sm">{u.profile?.nome ?? u.email}</span>
              <span className="text-xs text-muted">{u.email}</span>
              <Badge tone="neutral">{u.role}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
