import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

function dataHora(d: Date) {
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

type LinhaAuditoria = {
  id: string;
  criadoEm: Date;
  usuario: string;
  acao: string;
  detalhe: string | null;
  origem: "sistema" | "lead";
  leadId?: string;
};

export default async function AuditoriaPage() {
  const [logsAdmin, historicoLeads] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { criadoEm: "desc" },
      take: 80,
      include: { usuario: { select: { email: true, profile: { select: { nome: true } } } } },
    }),
    prisma.crmLeadHistorico.findMany({
      orderBy: { criadoEm: "desc" },
      take: 80,
      include: {
        usuario: { select: { email: true, profile: { select: { nome: true } } } },
        lead: { select: { id: true, nome: true } },
      },
    }),
  ]);

  const linhas: LinhaAuditoria[] = [
    ...logsAdmin.map((l) => ({
      id: `admin-${l.id}`,
      criadoEm: l.criadoEm,
      usuario: l.usuario?.profile?.nome ?? l.usuario?.email ?? "Sistema",
      acao: l.acao,
      detalhe: l.tabela ? `Tabela: ${l.tabela}` : null,
      origem: "sistema" as const,
    })),
    ...historicoLeads.map((h) => ({
      id: `lead-${h.id}`,
      criadoEm: h.criadoEm,
      usuario: h.usuario?.profile?.nome ?? h.usuario?.email ?? "Sistema",
      acao: `${h.acao} (lead: ${h.lead.nome})`,
      detalhe: h.detalhe,
      origem: "lead" as const,
      leadId: h.lead.id,
    })),
  ].sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Auditoria</h1>
        <p className="text-sm text-muted">
          Últimas 160 ações do sistema — logins, usuários e toda a movimentação de leads.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Linha do tempo</CardTitle>
          <CardDescription>Não pode ser apagada nem editada por usuários comuns.</CardDescription>
        </CardHeader>
        <div className="divide-y divide-border">
          {linhas.map((l) => (
            <div key={l.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
              <div className="flex items-start gap-2.5">
                <Badge tone={l.origem === "sistema" ? "amber" : "neutral"}>
                  {l.origem === "sistema" ? "Sistema" : "Lead"}
                </Badge>
                <div>
                  <p>
                    <span className="font-medium">{l.usuario}</span> —{" "}
                    {l.leadId ? (
                      <Link href={`/dashboard/crm/leads/${l.leadId}`} className="hover:text-accent hover:underline">
                        {l.acao}
                      </Link>
                    ) : (
                      l.acao
                    )}
                  </p>
                  {l.detalhe && <p className="text-xs text-muted">{l.detalhe}</p>}
                </div>
              </div>
              <span className="shrink-0 text-[11px] text-muted-2">{dataHora(l.criadoEm)}</span>
            </div>
          ))}
          {linhas.length === 0 && <p className="py-6 text-center text-sm text-muted">Nenhum registro ainda.</p>}
        </div>
      </Card>
    </div>
  );
}
