import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NovoMembroForm } from "./novo-membro-form";
import { EquipeAtivoToggle } from "./ativo-toggle";

export default async function EquipePage() {
  const membros = await prisma.profile.findMany({
    where: { user: { role: { in: ["SDR", "CLOSER"] } } },
    include: { user: { select: { email: true, role: true } } },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Equipe</h1>
        <p className="text-sm text-muted">SDRs e Closers da operação.</p>
      </div>

      <NovoMembroForm />

      <Card>
        <CardHeader>
          <CardTitle>Membros cadastrados</CardTitle>
        </CardHeader>
        <div className="divide-y divide-border">
          {membros.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-2.5">
              <span className="flex-1 text-sm font-medium">{m.nome}</span>
              <span className="text-xs text-muted">{m.user.email}</span>
              <Badge tone={m.user.role === "SDR" ? "amber" : "teal"}>{m.user.role}</Badge>
              <EquipeAtivoToggle profileId={m.id} ativoInicial={m.ativo} />
            </div>
          ))}
          {membros.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">Nenhum SDR ou Closer cadastrado ainda.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
