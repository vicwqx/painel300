import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria } from "@/lib/crm/sessao";
import { notFound, redirect } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AcoesLead } from "./acoes-lead";
import { STATUS_LABEL, STATUS_TONE, TEMPERATURA_LABEL, TEMPERATURA_TONE } from "@/lib/crm/labels";
import Link from "next/link";

export default async function CloserLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await sessaoCrmObrigatoria();

  const lead = await prisma.crmLead.findUnique({
    where: { id },
    include: { sdr: { select: { nome: true } }, qualificacao: true },
  });
  if (!lead) notFound();

  const podeVer = sessao.role === "ADMIN" || lead.closerId === sessao.profileId;
  if (!podeVer) redirect("/dashboard/closer");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/closer" className="text-xs text-muted hover:underline">
          ← Voltar pros meus leads
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{lead.nome}</h1>
          <Badge tone={STATUS_TONE[lead.status]}>{STATUS_LABEL[lead.status]}</Badge>
          {lead.temperatura && (
            <Badge tone={TEMPERATURA_TONE[lead.temperatura]}>{TEMPERATURA_LABEL[lead.temperatura]}</Badge>
          )}
        </div>
      </div>

      <Card className="border-accent/20 bg-accent-soft">
        <CardHeader>
          <CardTitle>Cliente</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Info label="Telefone" valor={lead.telefone} />
          <Info label="Veículo" valor={[lead.modeloVeiculo, lead.anoVeiculo].filter(Boolean).join(" ") || null} />
          <Info label="Placa" valor={lead.placa} />
          <Info label="Cidade" valor={lead.qualificacao?.cidade ?? lead.cidade} />
          <Info label="SDR" valor={lead.sdr?.nome ?? null} />
          <Info label="Melhor horário" valor={lead.qualificacao?.melhorHorario ?? null} />
        </div>
      </Card>

      {lead.qualificacao && (
        <Card>
          <CardHeader>
            <CardTitle>O que foi conversado na qualificação</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Info label="Interesse" valor={lead.qualificacao.interesse} />
            <Info label="Possui seguro" valor={
              lead.qualificacao.possuiSeguro === null ? null : lead.qualificacao.possuiSeguro ? "Sim" : "Não"
            } />
            <Info label="Seguradora atual" valor={lead.qualificacao.seguradoraAtual} />
            <Info label="Motivo da troca" valor={lead.qualificacao.motivoTroca} />
          </div>
          {lead.qualificacao.observacoes && (
            <p className="mt-3 rounded-md border border-border bg-surface-2 p-3 text-sm italic text-muted">
              &ldquo;{lead.qualificacao.observacoes}&rdquo;
            </p>
          )}
        </Card>
      )}

      <AcoesLead leadId={lead.id} status={lead.status} />

      <Link href={`/dashboard/crm/leads/${lead.id}`} className="block text-center text-xs text-muted hover:underline">
        Ver linha do tempo completa
      </Link>
    </div>
  );
}

function Info({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-2">{label}</p>
      <p className="font-medium">{valor || "—"}</p>
    </div>
  );
}
