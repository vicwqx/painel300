import { prisma } from "@/lib/prisma";
import { calcularPeriodo } from "@/lib/calculos/periodo";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodPicker } from "@/components/dashboard/period-picker";
import { Suspense } from "react";
import type { CrmLeadStatus } from "@prisma/client";

const STATUS_QUALIFICADO_EM_DIANTE: CrmLeadStatus[] = [
  "QUALIFICADO",
  "AGUARDANDO_CLOSER",
  "DISTRIBUIDO_CLOSER",
  "EM_CONTATO",
  "COTACAO",
  "NEGOCIACAO",
  "VENDA",
];
const STATUS_DESCARTADO: CrmLeadStatus[] = [
  "SEM_CONTATO",
  "NUMERO_INVALIDO",
  "SEM_INTERESSE",
  "DUPLICADO",
  "FORA_PERFIL",
];

export default async function GerenteProspectorPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; inicio?: string; fim?: string }>;
}) {
  const params = await searchParams;
  const periodoKey = params.periodo ?? "mes";
  const { inicio, fim, label } = calcularPeriodo(periodoKey, params.inicio, params.fim);
  const inicioData = new Date(inicio + "T00:00:00");
  const fimData = new Date(fim + "T23:59:59");

  const prospectores = await prisma.profile.findMany({
    where: { ativo: true, user: { role: "PROSPECTOR" } },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  const leadsNoPeriodo = await prisma.crmLead.findMany({
    where: {
      prospectorId: { in: prospectores.map((p) => p.id) },
      criadoEm: { gte: inicioData, lte: fimData },
    },
    select: { prospectorId: true, status: true },
  });

  const linhas = prospectores
    .map((p) => {
      const leadsDoProspector = leadsNoPeriodo.filter((l) => l.prospectorId === p.id);
      const qualificados = leadsDoProspector.filter((l) => STATUS_QUALIFICADO_EM_DIANTE.includes(l.status)).length;
      const descartados = leadsDoProspector.filter((l) => STATUS_DESCARTADO.includes(l.status)).length;
      const vendas = leadsDoProspector.filter((l) => l.status === "VENDA").length;
      const total = leadsDoProspector.length;
      const conversao = total > 0 ? (vendas / total) * 100 : 0;
      return { nome: p.nome, total, qualificados, descartados, vendas, conversao };
    })
    .sort((a, b) => b.total - a.total);

  const totalGeral = linhas.reduce((s, l) => s + l.total, 0);
  const qualificadosGeral = linhas.reduce((s, l) => s + l.qualificados, 0);
  const descartadosGeral = linhas.reduce((s, l) => s + l.descartados, 0);
  const vendasGeral = linhas.reduce((s, l) => s + l.vendas, 0);
  const mediaProspector = prospectores.length > 0 ? totalGeral / prospectores.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Equipe de prospecção</h1>
          <p className="text-sm text-muted">{label}</p>
        </div>
        <Suspense fallback={null}>
          <PeriodPicker periodoAtual={periodoKey} inicioAtual={params.inicio ?? inicio} fimAtual={params.fim ?? fim} />
        </Suspense>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Leads gerados</p>
          <p className="font-num text-2xl font-semibold">{totalGeral}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Qualificados</p>
          <p className="font-num text-2xl font-semibold text-teal">{qualificadosGeral}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Descartados</p>
          <p className="font-num text-2xl font-semibold text-red">{descartadosGeral}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Média por prospector</p>
          <p className="font-num text-2xl font-semibold">{mediaProspector.toFixed(1)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ranking de produtividade</CardTitle>
          <p className="mt-1 text-xs text-muted">
            {vendasGeral} vendas geradas a partir de leads dessa equipe no período — apenas visualização, não afeta
            permissões ou fluxo.
          </p>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-2">
                <th className="py-2 font-medium">Prospector</th>
                <th className="py-2 text-right font-medium">Leads</th>
                <th className="py-2 text-right font-medium">Qualificados</th>
                <th className="py-2 text-right font-medium">Descartados</th>
                <th className="py-2 text-right font-medium">Vendas</th>
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
                  <td className="py-2.5 text-right font-num font-semibold">{l.vendas}</td>
                  <td className="py-2.5 text-right font-num">{l.conversao.toFixed(1)}%</td>
                </tr>
              ))}
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted">
                    Nenhum prospector ativo cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
