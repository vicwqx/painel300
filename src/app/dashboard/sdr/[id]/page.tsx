import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria } from "@/lib/crm/sessao";
import { notFound, redirect } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QualificacaoForm } from "./qualificacao-form";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/crm/labels";
import Link from "next/link";

export default async function QualificarLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await sessaoCrmObrigatoria();

  const lead = await prisma.crmLead.findUnique({
    where: { id },
    include: { prospector: { select: { nome: true } } },
  });
  if (!lead) notFound();

  const podeVer = sessao.role === "ADMIN" || lead.sdrId === sessao.profileId;
  if (!podeVer) redirect("/dashboard/sdr");

  // Já saiu da etapa de qualificação — manda pra tela de leitura (histórico completo).
  if (lead.status !== "EM_QUALIFICACAO") {
    redirect(`/dashboard/crm/leads/${lead.id}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/sdr" className="text-xs text-muted hover:underline">
          ← Voltar pra fila
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{lead.nome}</h1>
          <Badge tone={STATUS_TONE[lead.status]}>{STATUS_LABEL[lead.status]}</Badge>
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
        </div>
        {lead.observacaoInicial && (
          <p className="mt-3 rounded-md border border-border bg-surface-2 p-3 text-sm italic text-muted">
            &ldquo;{lead.observacaoInicial}&rdquo;
          </p>
        )}
      </Card>

      <QualificacaoForm leadId={lead.id} />
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
