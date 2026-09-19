import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { bateuMetaDoDia, projecaoLinear } from "@/lib/calculos/metas";

const META_MENSAL_PADRAO = 300;

function inicioFimDoMes(hoje: Date) {
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  return { inicio, fim };
}

export default async function DashboardHomePage() {
  const hoje = new Date();
  const { inicio, fim } = inicioFimDoMes(hoje);
  const diaDoMes = hoje.getDate();
  const diasNoMes = fim.getDate();

  const [metaConfig, lancamentosDoMes, perfis] = await Promise.all([
    prisma.metaMensal.findFirst({ where: { vigencia: inicio } }),
    prisma.lancamentoDiario.findMany({
      where: { data: { gte: inicio, lte: fim } },
      include: { profile: true },
    }),
    prisma.profile.findMany({ where: { ativo: true } }),
  ]);

  const metaVendas = metaConfig?.metaVendas ?? META_MENSAL_PADRAO;

  const totais = lancamentosDoMes.reduce(
    (acc, l) => {
      acc.cotacoes += l.cotacoes;
      acc.ligacoes += l.ligacoes;
      acc.vendas += l.vendas;
      return acc;
    },
    { cotacoes: 0, ligacoes: 0, vendas: 0 }
  );

  const conversao = totais.cotacoes > 0 ? (totais.vendas / totais.cotacoes) * 100 : 0;
  const projecao = projecaoLinear(totais.vendas, diaDoMes, diasNoMes);

  // ranking: agrega por pessoa e conta dias com meta batida
  const porPessoa = new Map<
    string,
    { nome: string; cotacoes: number; ligacoes: number; vendas: number; diasComMeta: number }
  >();
  for (const perfil of perfis) {
    porPessoa.set(perfil.id, { nome: perfil.nome, cotacoes: 0, ligacoes: 0, vendas: 0, diasComMeta: 0 });
  }
  for (const l of lancamentosDoMes) {
    const acc = porPessoa.get(l.profileId);
    if (!acc) continue;
    acc.cotacoes += l.cotacoes;
    acc.ligacoes += l.ligacoes;
    acc.vendas += l.vendas;
    if (bateuMetaDoDia(l)) acc.diasComMeta += 1;
  }
  const ranking = Array.from(porPessoa.values()).sort((a, b) => b.vendas - a.vendas);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Visão geral — {hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h1>
        <p className="text-sm text-muted">Meta do mês: {metaVendas} vendas</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Cotações" valor={totais.cotacoes} />
        <KpiCard label="Ligações" valor={totais.ligacoes} />
        <KpiCard label="Vendas" valor={totais.vendas} tom="teal" />
        <KpiCard label="Conversão" valor={`${conversao.toFixed(1)}%`} tom="amber" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meta do mês</CardTitle>
        </CardHeader>
        <div className="flex items-center gap-6">
          <div className="font-num text-3xl font-semibold">
            {totais.vendas}
            <span className="text-base font-normal text-muted"> / {metaVendas}</span>
          </div>
          <p className="text-sm text-muted">
            No ritmo atual, a equipe fecha o mês com{" "}
            <span
              className={
                projecao >= metaVendas ? "font-semibold text-teal" : "font-semibold text-red"
              }
            >
              {projecao} vendas
            </span>
            .
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ranking da equipe</CardTitle>
        </CardHeader>
        <div className="divide-y divide-border">
          {ranking.map((pessoa, i) => (
            <div key={pessoa.nome} className="flex items-center gap-3 py-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-surface-2 font-mono text-xs font-bold text-muted">
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-medium">{pessoa.nome}</span>
              <span className="font-num text-sm text-muted">{pessoa.cotacoes} cot.</span>
              <span className="font-num text-sm text-muted">{pessoa.ligacoes} lig.</span>
              <span className="font-num text-sm font-semibold text-teal">{pessoa.vendas} vend.</span>
              <Badge tone={pessoa.diasComMeta > 0 ? "teal" : "neutral"}>
                {pessoa.diasComMeta} dia(s) na meta
              </Badge>
            </div>
          ))}
          {ranking.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">Nenhum lançamento neste mês ainda.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function KpiCard({
  label,
  valor,
  tom,
}: {
  label: string;
  valor: string | number;
  tom?: "teal" | "amber";
}) {
  const cor = tom === "teal" ? "text-teal" : tom === "amber" ? "text-amber" : "text-foreground";
  return (
    <Card className="p-4">
      <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className={`font-num text-2xl font-semibold ${cor}`}>{valor}</p>
    </Card>
  );
}
