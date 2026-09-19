import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria } from "@/lib/crm/sessao";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssumirButton } from "./assumir-button";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/crm/labels";
import Link from "next/link";

function dataHora(d: Date) {
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default async function SdrPage() {
  const sessao = await sessaoCrmObrigatoria();

  const [fila, meusLeads, qualificadosHoje, qualificadosMes] = await Promise.all([
    prisma.crmLead.findMany({
      where: { status: "AGUARDANDO_SDR", sdrId: null },
      include: { prospector: { select: { nome: true } } },
      orderBy: { criadoEm: "asc" },
      take: 30,
    }),
    prisma.crmLead.findMany({
      where: { sdrId: sessao.profileId, status: "EM_QUALIFICACAO" },
      orderBy: { criadoEm: "asc" },
    }),
    prisma.crmLead.count({
      where: {
        sdrId: sessao.profileId,
        qualificadoEm: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.crmLead.count({
      where: {
        sdrId: sessao.profileId,
        qualificadoEm: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Olá, {sessao.nome.split(" ")[0]}</h1>
        <p className="text-sm text-muted">Fila de qualificação.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Na fila agora</p>
          <p className="font-num text-2xl font-semibold">{fila.length}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Comigo (em andamento)</p>
          <p className="font-num text-2xl font-semibold text-amber">{meusLeads.length}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Qualificados hoje</p>
          <p className="font-num text-2xl font-semibold text-teal">{qualificadosHoje}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Qualificados no mês</p>
          <p className="font-num text-2xl font-semibold text-teal">{qualificadosMes}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meus leads (em qualificação)</CardTitle>
        </CardHeader>
        {meusLeads.length === 0 ? (
          <p className="text-sm text-muted">Nenhum lead assumido no momento — pegue um da fila abaixo.</p>
        ) : (
          <div className="divide-y divide-border">
            {meusLeads.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <Link href={`/dashboard/sdr/${l.id}`} className="flex-1 font-medium hover:text-accent hover:underline">
                  {l.nome}
                </Link>
                <span className="text-xs text-muted">{l.telefone}</span>
                <Badge tone={STATUS_TONE[l.status]}>{STATUS_LABEL[l.status]}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fila de leads disponíveis</CardTitle>
          <p className="mt-1 text-xs text-muted">Ordenada por quem chegou primeiro.</p>
        </CardHeader>
        {fila.length === 0 ? (
          <p className="text-sm text-muted">Fila vazia no momento.</p>
        ) : (
          <div className="divide-y divide-border">
            {fila.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold">{l.nome}</p>
                  <p className="text-xs text-muted">
                    {l.telefone} {l.placa ? `· ${l.placa}` : ""} · Prospector: {l.prospector.nome}
                  </p>
                  {l.observacaoInicial && (
                    <p className="mt-1 text-xs italic text-muted-2">&ldquo;{l.observacaoInicial}&rdquo;</p>
                  )}
                  <p className="mt-0.5 text-[10px] text-muted-2">Criado em {dataHora(l.criadoEm)}</p>
                </div>
                <AssumirButton leadId={l.id} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
