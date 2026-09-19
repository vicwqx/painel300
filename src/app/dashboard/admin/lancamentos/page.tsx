import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LancamentosTable } from "@/components/dashboard/lancamentos-table";

export default async function LancamentosLogPage() {
  const lancamentos = await prisma.lancamentoDiario.findMany({
    include: { profile: true },
    orderBy: { criadoEm: "desc" },
    take: 300,
  });

  const linhas = lancamentos.map((l) => ({
    id: l.id,
    nome: l.profile.nome,
    data: l.data.toISOString().slice(0, 10),
    prospeccoes: l.prospeccoes,
    indicacoes: l.indicacoes,
    ligacoes: l.ligacoes,
    atendidas: l.atendidas,
    cotacoes: l.cotacoes,
    followup: l.followup,
    vendas: l.vendas,
    ativas: l.ativas,
    criadoEm: l.criadoEm.toISOString(),
    atualizadoEm: l.atualizadoEm.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Log de lançamentos</h1>
        <p className="text-sm text-muted">Últimos 300 lançamentos, mais recentes primeiro (por data de registro).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os lançamentos</CardTitle>
          <CardDescription>
            Mostra quando cada lançamento foi de fato registrado no sistema — útil pra auditoria.
          </CardDescription>
        </CardHeader>
        <LancamentosTable linhas={linhas} />
      </Card>
    </div>
  );
}
