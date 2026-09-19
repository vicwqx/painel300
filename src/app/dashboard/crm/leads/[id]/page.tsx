import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria } from "@/lib/crm/sessao";
import { rotaPadraoDoPapel } from "@/lib/rotas";
import { notFound, redirect } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, STATUS_TONE, TEMPERATURA_LABEL, TEMPERATURA_TONE } from "@/lib/crm/labels";
import Link from "next/link";

function dataHora(d: Date) {
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default async function LeadDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await sessaoCrmObrigatoria();

  const lead = await prisma.crmLead.findUnique({
    where: { id },
    include: {
      prospector: { select: { nome: true } },
      sdr: { select: { nome: true } },
      closer: { select: { nome: true } },
      qualificacao: true,
      historico: {
        orderBy: { criadoEm: "asc" },
        include: { usuario: { select: { profile: { select: { nome: true } } } } },
      },
    },
  });
  if (!lead) notFound();

  const podeVer =
    sessao.role === "ADMIN" ||
    lead.prospectorId === sessao.profileId ||
    lead.sdrId === sessao.profileId ||
    lead.closerId === sessao.profileId;
  if (!podeVer) redirect(rotaPadraoDoPapel(sessao.role));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href={rotaPadraoDoPapel(sessao.role)} className="text-xs text-muted hover:underline">
          ← Voltar
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{lead.nome}</h1>
          <Badge tone={STATUS_TONE[lead.status]}>{STATUS_LABEL[lead.status]}</Badge>
          {lead.temperatura && (
            <Badge tone={TEMPERATURA_TONE[lead.temperatura]}>{TEMPERATURA_LABEL[lead.temperatura]}</Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do lead</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Info label="Telefone" valor={lead.telefone} />
          <Info label="Placa" valor={lead.placa} />
          <Info label="Modelo" valor={lead.modeloVeiculo} />
          <Info label="Ano" valor={lead.anoVeiculo} />
          <Info label="Cidade" valor={lead.cidade} />
          <Info label="Origem" valor={lead.origem} />
          <Info label="Prospector" valor={lead.prospector.nome} />
          <Info label="SDR" valor={lead.sdr?.nome ?? null} />
          <Info label="Closer" valor={lead.closer?.nome ?? null} />
        </div>
        {lead.observacaoInicial && (
          <p className="mt-3 rounded-md border border-border bg-surface-2 p-3 text-sm italic text-muted">
            &ldquo;{lead.observacaoInicial}&rdquo;
          </p>
        )}
      </Card>

      {lead.qualificacao && (
        <Card>
          <CardHeader>
            <CardTitle>Qualificação</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Info label="Cliente respondeu" valor={lead.qualificacao.clienteRespondeu ? "Sim" : "Não"} />
            <Info label="Interesse" valor={lead.qualificacao.interesse} />
            <Info label="Possui seguro" valor={
              lead.qualificacao.possuiSeguro === null ? null : lead.qualificacao.possuiSeguro ? "Sim" : "Não"
            } />
            <Info label="Seguradora atual" valor={lead.qualificacao.seguradoraAtual} />
            <Info label="Motivo da troca" valor={lead.qualificacao.motivoTroca} />
            <Info label="Melhor horário" valor={lead.qualificacao.melhorHorario} />
          </div>
          {lead.qualificacao.observacoes && (
            <p className="mt-3 rounded-md border border-border bg-surface-2 p-3 text-sm italic text-muted">
              &ldquo;{lead.qualificacao.observacoes}&rdquo;
            </p>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Linha do tempo</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          {lead.historico.map((h) => (
            <div key={h.id} className="flex gap-3 text-sm">
              <span className="w-16 shrink-0 font-num text-xs text-muted-2">{dataHora(h.criadoEm).split(" ")[1]}</span>
              <div>
                <p>
                  <span className="font-medium">{h.usuario?.profile?.nome ?? "Sistema"}</span> — {h.acao}
                </p>
                {h.detalhe && <p className="text-xs text-muted">{h.detalhe}</p>}
              </div>
            </div>
          ))}
          {lead.historico.length === 0 && <p className="text-sm text-muted">Sem histórico ainda.</p>}
        </div>
      </Card>
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
