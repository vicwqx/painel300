import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { calcularPeriodo, somarDias, inicioCiclo, fimCiclo } from "@/lib/calculos/periodo";
import { PeriodPicker } from "@/components/dashboard/period-picker";
import { HeroMeta } from "@/components/dashboard/hero-meta";
import { KpiTrend } from "@/components/dashboard/kpi-trend";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { EvolutionChart, type PontoEvolucao } from "@/components/dashboard/evolution-chart";
import { Heatmap, type DiaHeatmap } from "@/components/dashboard/heatmap";
import { RankingTable, type LinhaRanking } from "@/components/dashboard/ranking-table";
import { Highlights, type Destaque } from "@/components/dashboard/highlights";
import { Insights } from "@/components/dashboard/insights";
import { Suspense } from "react";

const META_MENSAL_PADRAO = 300;
const MAX_DIAS_TENDENCIA = 62;

function dataISO(d: Date) {
  return d.toISOString().slice(0, 10);
}
function listaDias(inicio: string, fim: string) {
  const dias: string[] = [];
  let cursor = inicio;
  while (cursor <= fim) {
    dias.push(cursor);
    cursor = somarDias(cursor, 1);
  }
  return dias;
}
function variacaoPct(atual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return ((atual - anterior) / anterior) * 100;
}
function formatarMesAno(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase();
}

export default async function DashboardHomePage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; inicio?: string; fim?: string }>;
}) {
  const params = await searchParams;
  const periodoKey = params.periodo ?? "mes";
  const { inicio, fim, label } = calcularPeriodo(periodoKey, params.inicio, params.fim);
  const isMesCalendario = periodoKey === "mes" || periodoKey === "mes_passado";

  const diasNoIntervalo = listaDias(inicio, fim);
  const comprimento = diasNoIntervalo.length;
  const anteriorFim = somarDias(inicio, -1);
  const anteriorInicio = somarDias(anteriorFim, -(comprimento - 1));

  const vigenciaMeta = isMesCalendario ? inicio : inicioCiclo(dataISO(new Date()));

  const [metaConfig, lancamentos, lancamentosAnterior, perfis] = await Promise.all([
    prisma.metaMensal.findFirst({ where: { vigencia: new Date(vigenciaMeta) } }),
    prisma.lancamentoDiario.findMany({
      where: { data: { gte: new Date(inicio), lte: new Date(fim) } },
      include: { profile: true },
      orderBy: { data: "asc" },
    }),
    prisma.lancamentoDiario.findMany({
      where: { data: { gte: new Date(anteriorInicio), lte: new Date(anteriorFim) } },
      select: { prospeccoes: true, cotacoes: true, ligacoes: true, vendas: true },
    }),
    prisma.profile.findMany({ where: { ativo: true } }),
  ]);

  const metaVendas = metaConfig?.metaVendas ?? META_MENSAL_PADRAO;

  const totais = lancamentos.reduce(
    (acc, l) => {
      acc.prospeccoes += l.prospeccoes;
      acc.indicacoes += l.indicacoes;
      acc.cotacoes += l.cotacoes;
      acc.ligacoes += l.ligacoes;
      acc.atendidas += l.atendidas;
      acc.followup += l.followup;
      acc.vendas += l.vendas;
      acc.ativas += l.ativas;
      return acc;
    },
    { prospeccoes: 0, indicacoes: 0, cotacoes: 0, ligacoes: 0, atendidas: 0, followup: 0, vendas: 0, ativas: 0 }
  );

  const totaisAnterior = lancamentosAnterior.reduce(
    (acc, l) => {
      acc.prospeccoes += l.prospeccoes;
      acc.cotacoes += l.cotacoes;
      acc.ligacoes += l.ligacoes;
      acc.vendas += l.vendas;
      return acc;
    },
    { prospeccoes: 0, cotacoes: 0, ligacoes: 0, vendas: 0 }
  );

  const conversao = totais.cotacoes > 0 ? (totais.vendas / totais.cotacoes) * 100 : 0;

  const varVendas = variacaoPct(totais.vendas, totaisAnterior.vendas);
  const varCotacoes = variacaoPct(totais.cotacoes, totaisAnterior.cotacoes);
  const varLigacoes = variacaoPct(totais.ligacoes, totaisAnterior.ligacoes);
  const varProspeccoes = variacaoPct(totais.prospeccoes, totaisAnterior.prospeccoes);

  // Projeção — só faz sentido dentro de um ciclo mensal
  let projecao: number | null = null;
  if (periodoKey === "mes") {
    const inicioCicloStr = inicioCiclo(inicio);
    const fimCicloStr = fimCiclo(inicioCicloStr);
    const diasPassados =
      Math.floor((new Date(fim + "T00:00:00").getTime() - new Date(inicioCicloStr + "T00:00:00").getTime()) / 86400000) + 1;
    const diasTotais =
      Math.floor((new Date(fimCicloStr + "T00:00:00").getTime() - new Date(inicioCicloStr + "T00:00:00").getTime()) / 86400000) + 1;
    if (diasPassados > 0) projecao = Math.round((totais.vendas / diasPassados) * diasTotais);
  } else if (periodoKey === "mes_passado") {
    projecao = totais.vendas;
  }

  // Ranking
  const teamSize = Math.max(1, perfis.length);
  const metaIndividual = Math.round(metaVendas / teamSize);
  const porPessoa = new Map<string, LinhaRanking>();
  for (const p of perfis) {
    porPessoa.set(p.id, { id: p.id, nome: p.nome, vendas: 0, cotacoes: 0, ligacoes: 0, metaIndividual });
  }
  for (const l of lancamentos) {
    const acc = porPessoa.get(l.profileId);
    if (!acc) continue;
    acc.vendas += l.vendas;
    acc.cotacoes += l.cotacoes;
    acc.ligacoes += l.ligacoes;
  }
  const ranking = Array.from(porPessoa.values()).sort((a, b) => b.vendas - a.vendas);

  // Destaques
  const destaques: Destaque[] = [];
  const comAtividade = ranking.filter((r) => r.vendas > 0 || r.cotacoes > 0 || r.ligacoes > 0);
  if (comAtividade.length > 0) {
    const maisVendas = [...ranking].sort((a, b) => b.vendas - a.vendas)[0];
    if (maisVendas.vendas > 0) destaques.push({ rotulo: "Mais vendas", nome: maisVendas.nome, valor: `${maisVendas.vendas} vendas` });

    const maisCotacoes = [...ranking].sort((a, b) => b.cotacoes - a.cotacoes)[0];
    if (maisCotacoes.cotacoes > 0)
      destaques.push({ rotulo: "Mais cotações", nome: maisCotacoes.nome, valor: `${maisCotacoes.cotacoes} cotações` });

    const maisLigacoes = [...ranking].sort((a, b) => b.ligacoes - a.ligacoes)[0];
    if (maisLigacoes.ligacoes > 0)
      destaques.push({ rotulo: "Mais ligações", nome: maisLigacoes.nome, valor: `${maisLigacoes.ligacoes} ligações` });

    const comConversao = ranking
      .filter((r) => r.cotacoes > 0)
      .sort((a, b) => b.vendas / b.cotacoes - a.vendas / a.cotacoes)[0];
    if (comConversao)
      destaques.push({
        rotulo: "Melhor conversão",
        nome: comConversao.nome,
        valor: `${((comConversao.vendas / comConversao.cotacoes) * 100).toFixed(0)}%`,
      });
  }

  // Insights
  const insights: string[] = [];
  if (isMesCalendario) {
    const faltam = Math.max(0, metaVendas - totais.vendas);
    insights.push(
      faltam === 0
        ? `Meta de ${metaVendas} vendas do período já foi atingida.`
        : `Faltam ${faltam} vendas para bater a meta de ${metaVendas} do período.`
    );
  }
  if (ranking.length > 0 && ranking[0].vendas > 0) {
    insights.push(`${ranking[0].nome} lidera o período com ${ranking[0].vendas} vendas.`);
  }
  if (varVendas !== null) {
    insights.push(
      `Vendas ${varVendas >= 0 ? "cresceram" : "caíram"} ${Math.abs(varVendas).toFixed(1)}% em relação ao período anterior.`
    );
  }

  // Evolução + mapa de calor
  const mostrarTendencia = comprimento <= MAX_DIAS_TENDENCIA;
  let serieEvolucao: PontoEvolucao[] = [];
  let heatmapDias: DiaHeatmap[] = [];

  if (mostrarTendencia) {
    const porDia = new Map(
      diasNoIntervalo.map((d) => [d, { vendas: 0, cotacoes: 0, prospeccoes: 0, ligacoes: 0 }])
    );
    for (const l of lancamentos) {
      const chave = dataISO(l.data);
      const acc = porDia.get(chave);
      if (!acc) continue;
      acc.vendas += l.vendas;
      acc.cotacoes += l.cotacoes;
      acc.prospeccoes += l.prospeccoes;
      acc.ligacoes += l.ligacoes;
    }
    serieEvolucao = Array.from(porDia.entries()).map(([dia, v]) => ({
      dia: dia.slice(5).split("-").reverse().join("/"),
      vendas: v.vendas,
      cotacoes: v.cotacoes,
      prospeccoes: v.prospeccoes,
    }));
    if (isMesCalendario) {
      heatmapDias = Array.from(porDia.entries()).map(([dia, v]) => ({
        dia: parseInt(dia.slice(8, 10)),
        dataLabel: dia.split("-").reverse().join("/"),
        vendas: v.vendas,
        cotacoes: v.cotacoes,
        ligacoes: v.ligacoes,
      }));
    }
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-2">
            {formatarMesAno(fim)}
          </p>
          <h1 className="text-2xl font-bold text-foreground">Visão geral</h1>
          <p className="mt-0.5 text-sm text-muted">Performance comercial da Equipe 300 · {label}</p>
        </div>
        <Suspense fallback={null}>
          <PeriodPicker periodoAtual={periodoKey} inicioAtual={params.inicio ?? inicio} fimAtual={params.fim ?? fim} />
        </Suspense>
      </div>

      {lancamentos.length === 0 && (
        <Card className="border-accent/20 bg-accent-soft">
          <p className="text-sm">
            Nenhum lançamento neste período —{" "}
            <a href="?periodo=tudo" className="font-semibold text-accent underline">
              ver todo o histórico
            </a>
            .
          </p>
        </Card>
      )}

      {isMesCalendario && (
        <HeroMeta
          titulo={`Meta de ${formatarMesAno(fim)}`}
          vendas={totais.vendas}
          meta={metaVendas}
          projecao={projecao}
          variacaoVsAnterior={periodoKey === "mes" ? varVendas : null}
        />
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTrend label="Vendas" valor={totais.vendas} variacao={varVendas} destaque />
        <KpiTrend label="Cotações" valor={totais.cotacoes} variacao={varCotacoes} />
        <KpiTrend label="Ligações" valor={totais.ligacoes} variacao={varLigacoes} />
        <KpiTrend label="Conversão" valor={Number(conversao.toFixed(1))} variacao={null} suffix="%" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTrend label="Prospecções" valor={totais.prospeccoes} variacao={varProspeccoes} />
        <KpiTrend label="Indicações" valor={totais.indicacoes} variacao={null} />
        <KpiTrend label="Atendidas" valor={totais.atendidas} variacao={null} />
        <KpiTrend label="Followup" valor={totais.followup} variacao={null} />
      </div>

      <Insights frases={insights} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Evolução de vendas</CardTitle>
          </CardHeader>
          {mostrarTendencia ? (
            <EvolutionChart dados={serieEvolucao} />
          ) : (
            <p className="py-10 text-center text-xs text-muted">
              Período longo demais pra tendência diária — escolha um intervalo menor.
            </p>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Funil de conversão</CardTitle>
          </CardHeader>
          <FunnelChart
            prospeccoes={totais.prospeccoes}
            ligacoes={totais.ligacoes}
            cotacoes={totais.cotacoes}
            vendas={totais.vendas}
          />
        </Card>
      </div>

      <Highlights destaques={destaques} />

      <Card>
        <CardHeader>
          <CardTitle>Performance da equipe</CardTitle>
        </CardHeader>
        <RankingTable linhas={ranking} />
      </Card>

      {isMesCalendario && heatmapDias.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Atividade do período</CardTitle>
          </CardHeader>
          <Heatmap dias={heatmapDias} />
        </Card>
      )}
    </div>
  );
}
