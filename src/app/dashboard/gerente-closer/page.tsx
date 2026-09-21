import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DistribuirSelect } from "./distribuir-select";
import { NovoUsuarioForm } from "@/components/dashboard/novo-usuario-form";
import { criarCloserAction } from "./actions";
import { TEMPERATURA_LABEL, TEMPERATURA_TONE } from "@/lib/crm/labels";
import Link from "next/link";
import type { CrmLeadStatus } from "@prisma/client";

function dataHora(d: Date) {
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

const STATUS_EM_ANDAMENTO_CLOSER: CrmLeadStatus[] = [
  "DISTRIBUIDO_CLOSER",
  "EM_CONTATO",
  "COTACAO",
  "NEGOCIACAO",
  "RETORNO_AGENDADO",
];

export default async function GerenteCloserPage() {
  const [fila, closers, emAndamento, vendasNoMes] = await Promise.all([
    prisma.crmLead.findMany({
      where: { status: "AGUARDANDO_CLOSER" },
      include: {
        prospector: { select: { nome: true } },
        sdr: { select: { nome: true } },
        qualificacao: true,
      },
      orderBy: { enviadoParaCloserEm: "asc" },
      take: 30,
    }),
    prisma.profile.findMany({
      where: { ativo: true, user: { role: "CLOSER" } },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.crmLead.groupBy({
      by: ["closerId"],
      where: { status: { in: STATUS_EM_ANDAMENTO_CLOSER }, closerId: { not: null } },
      _count: { _all: true },
    }),
    prisma.crmLead.count({
      where: {
        status: "VENDA",
        fechadoEm: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
  ]);

  const totalEmAndamento = emAndamento.reduce((s, r) => s + r._count._all, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Distribuição para closers</h1>
        <p className="text-sm text-muted">Leads qualificados aguardando um closer.</p>
      </div>

      <NovoUsuarioForm
        action={criarCloserAction}
        titulo="Novo closer"
        descricao="Cria login e perfil de closer direto pra sua equipe."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Aguardando distribuição</p>
          <p className="font-num text-2xl font-semibold text-amber">{fila.length}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Em andamento com closers</p>
          <p className="font-num text-2xl font-semibold">{totalEmAndamento}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Vendas no mês</p>
          <p className="font-num text-2xl font-semibold text-teal">{vendasNoMes}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Closers ativos</p>
          <p className="font-num text-2xl font-semibold">{closers.length}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fila de distribuição</CardTitle>
          <p className="mt-1 text-xs text-muted">Ordenada por quem chegou primeiro.</p>
        </CardHeader>
        {fila.length === 0 ? (
          <p className="text-sm text-muted">Nenhum lead aguardando distribuição no momento.</p>
        ) : closers.length === 0 ? (
          <p className="text-sm text-muted">
            Não há nenhum closer ativo cadastrado ainda — crie um usuário com papel Closer na Administração.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {fila.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/crm/leads/${l.id}`} className="text-sm font-semibold hover:text-accent hover:underline">
                      {l.nome}
                    </Link>
                    {l.temperatura && (
                      <Badge tone={TEMPERATURA_TONE[l.temperatura]}>{TEMPERATURA_LABEL[l.temperatura]}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted">
                    {l.telefone} · Qualificado por: {l.sdr?.nome ?? "—"} · Prospector: {l.prospector.nome}
                  </p>
                  {l.qualificacao?.observacoes && (
                    <p className="mt-1 text-xs italic text-muted-2">&ldquo;{l.qualificacao.observacoes}&rdquo;</p>
                  )}
                  <p className="mt-0.5 text-[10px] text-muted-2">
                    Qualificado em {l.qualificadoEm ? dataHora(l.qualificadoEm) : "—"}
                  </p>
                </div>
                <DistribuirSelect leadId={l.id} closers={closers} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
