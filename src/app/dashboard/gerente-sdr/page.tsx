import { prisma } from "@/lib/prisma";
import { calcularPeriodo } from "@/lib/calculos/periodo";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodPicker } from "@/components/dashboard/period-picker";
import { RedistribuirSelect } from "./redistribuir-select";
import { NovoUsuarioForm } from "@/components/dashboard/novo-usuario-form";
import { criarSdrAction } from "./actions";
import { Suspense } from "react";
import Link from "next/link";
import type { CrmLeadStatus } from "@prisma/client";

const STATUS_DESCARTADO: CrmLeadStatus[] = [
  "SEM_CONTATO",
  "NUMERO_INVALIDO",
  "SEM_INTERESSE",
  "DUPLICADO",
  "FORA_PERFIL",
];

export default async function GerenteSdrPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; inicio?: string; fim?: string }>;
}) {
  const params = await searchParams;
  const periodoKey = params.periodo ?? "mes";
  const { inicio, fim, label } = calcularPeriodo(periodoKey, params.inicio, params.fim);
  const inicioData = new Date(inicio + "T00:00:00");
  const fimData = new Date(fim + "T23:59:59");

  const [sdrs, leadsTrabalhados, leadsTravados] = await Promise.all([
    prisma.profile.findMany({
      where: { ativo: true, user: { role: "SDR" } },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    // Leads que tiveram alguma ação de SDR no período: assumidos (têm sdrId) e criados/qualificados na janela.
    prisma.crmLead.findMany({
      where: {
        sdrId: { not: null },
        OR: [
          { criadoEm: { gte: inicioData, lte: fimData } },
          { qualificadoEm: { gte: inicioData, lte: fimData } },
        ],
      },
      select: { sdrId: true, status: true, qualificadoEm: true },
    }),
    prisma.crmLead.findMany({
      where: { status: "EM_QUALIFICACAO" },
      include: { sdr: { select: { id: true, nome: true } } },
      orderBy: { criadoEm: "asc" },
      take: 30,
    }),
  ]);

  const linhas = sdrs
    .map((s) => {
      const leadsDoSdr = leadsTrabalhados.filter((l) => l.sdrId === s.id);
      const qualificados = leadsDoSdr.filter((l) => l.qualificadoEm !== null).length;
      const descartados = leadsDoSdr.filter((l) => STATUS_DESCARTADO.includes(l.status)).length;
      const total = leadsDoSdr.length;
      const conversao = total > 0 ? (qualificados / total) * 100 : 0;
      return { nome: s.nome, total, qualificados, descartados, conversao };
    })
    .sort((a, b) => b.total - a.total);

  const totalTrabalhado = linhas.reduce((s, l) => s + l.total, 0);
  const totalQualificado = linhas.reduce((s, l) => s + l.qualificados, 0);
  const totalDescartado = linhas.reduce((s, l) => s + l.descartados, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Equipe de SDR</h1>
          <p className="text-sm text-muted">{label}</p>
        </div>
        <Suspense fallback={null}>
          <PeriodPicker periodoAtual={periodoKey} inicioAtual={params.inicio ?? inicio} fimAtual={params.fim ?? fim} />
        </Suspense>
      </div>

      <NovoUsuarioForm
        action={criarSdrAction}
        titulo="Novo SDR"
        descricao="Cria login e perfil de SDR direto pra sua equipe."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Leads trabalhados</p>
          <p className="font-num text-2xl font-semibold">{totalTrabalhado}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Qualificados</p>
          <p className="font-num text-2xl font-semibold text-teal">{totalQualificado}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Descartados</p>
          <p className="font-num text-2xl font-semibold text-red">{totalDescartado}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Em qualificação agora</p>
          <p className="font-num text-2xl font-semibold text-amber">{leadsTravados.length}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Carga de trabalho por SDR</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-2">
                <th className="py-2 font-medium">SDR</th>
                <th className="py-2 text-right font-medium">Trabalhados</th>
                <th className="py-2 text-right font-medium">Qualificados</th>
                <th className="py-2 text-right font-medium">Descartados</th>
                <th className="py-2 text-right font-medium">Conversão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {linhas.map((l) => (
                <tr key={l.nome}>
                  <td className="py-2.5 font-medium">{l.nome}</td>
                  <td className="py-2.5 text-right font-num">{l.total}</td>
                  <td className="py-2.5 text-right font-num text-teal">{l.qualificados}</td>
                  <td className="py-2.5 text-right font-num text-muted">{l.descartados}</td>
                  <td className="py-2.5 text-right font-num">{l.conversao.toFixed(1)}%</td>
                </tr>
              ))}
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-muted">
                    Nenhum SDR ativo cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leads em qualificação agora</CardTitle>
          <p className="mt-1 text-xs text-muted">Redistribua se algum estiver travado com um SDR sobrecarregado.</p>
        </CardHeader>
        {leadsTravados.length === 0 ? (
          <p className="text-sm text-muted">Nenhum lead em qualificação no momento.</p>
        ) : (
          <div className="divide-y divide-border">
            {leadsTravados.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link href={`/dashboard/crm/leads/${l.id}`} className="text-sm font-semibold hover:text-accent hover:underline">
                    {l.nome}
                  </Link>
                  <p className="text-xs text-muted">Com: {l.sdr?.nome ?? "—"}</p>
                </div>
                <RedistribuirSelect leadId={l.id} sdrAtualId={l.sdrId} sdrs={sdrs} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
