import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria } from "@/lib/crm/sessao";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, STATUS_TONE, TEMPERATURA_LABEL, TEMPERATURA_TONE } from "@/lib/crm/labels";
import Link from "next/link";
import type { CrmLeadStatus } from "@prisma/client";

const GRUPOS: { titulo: string; status: CrmLeadStatus[] }[] = [
  { titulo: "Novos (distribuídos)", status: ["DISTRIBUIDO_CLOSER"] },
  { titulo: "Em contato", status: ["EM_CONTATO"] },
  { titulo: "Cotação", status: ["COTACAO"] },
  { titulo: "Negociação", status: ["NEGOCIACAO"] },
  { titulo: "Retorno agendado", status: ["RETORNO_AGENDADO"] },
];

export default async function CloserPage() {
  const sessao = await sessaoCrmObrigatoria();

  const inicioDoMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [meusLeads, vendasNoMes, perdidosNoMes] = await Promise.all([
    prisma.crmLead.findMany({
      where: {
        closerId: sessao.profileId,
        status: { in: ["DISTRIBUIDO_CLOSER", "EM_CONTATO", "COTACAO", "NEGOCIACAO", "RETORNO_AGENDADO"] },
      },
      include: { qualificacao: true },
      orderBy: { distribuidoEm: "asc" },
    }),
    prisma.crmLead.count({
      where: { closerId: sessao.profileId, status: "VENDA", fechadoEm: { gte: inicioDoMes } },
    }),
    prisma.crmLead.count({
      where: { closerId: sessao.profileId, status: "PERDIDO", fechadoEm: { gte: inicioDoMes } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Olá, {sessao.nome.split(" ")[0]}</h1>
        <p className="text-sm text-muted">Seus leads em andamento.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Leads em andamento</p>
          <p className="font-num text-2xl font-semibold">{meusLeads.length}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Vendas no mês</p>
          <p className="font-num text-2xl font-semibold text-teal">{vendasNoMes}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Perdidos no mês</p>
          <p className="font-num text-2xl font-semibold text-red">{perdidosNoMes}</p>
        </Card>
      </div>

      {GRUPOS.map((grupo) => {
        const leadsDoGrupo = meusLeads.filter((l) => grupo.status.includes(l.status));
        if (leadsDoGrupo.length === 0) return null;
        return (
          <Card key={grupo.titulo}>
            <CardHeader>
              <CardTitle>
                {grupo.titulo} ({leadsDoGrupo.length})
              </CardTitle>
            </CardHeader>
            <div className="divide-y divide-border">
              {leadsDoGrupo.map((l) => (
                <div key={l.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                  <Link href={`/dashboard/closer/${l.id}`} className="flex-1 font-medium hover:text-accent hover:underline">
                    {l.nome}
                  </Link>
                  <span className="text-xs text-muted">{l.telefone}</span>
                  {l.temperatura && (
                    <Badge tone={TEMPERATURA_TONE[l.temperatura]}>{TEMPERATURA_LABEL[l.temperatura]}</Badge>
                  )}
                  <Badge tone={STATUS_TONE[l.status]}>{STATUS_LABEL[l.status]}</Badge>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {meusLeads.length === 0 && (
        <Card>
          <p className="text-sm text-muted">Nenhum lead em andamento no momento.</p>
        </Card>
      )}
    </div>
  );
}
