import { prisma } from "@/lib/prisma";
import { calcularPeriodo } from "@/lib/calculos/periodo";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodPicker } from "@/components/dashboard/period-picker";
import { Suspense } from "react";
import Link from "next/link";

export default async function GerentePage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; inicio?: string; fim?: string }>;
}) {
  const params = await searchParams;
  const periodoKey = params.periodo ?? "mes";
  const { inicio, fim, label } = calcularPeriodo(periodoKey, params.inicio, params.fim);
  const inicioData = new Date(inicio);
  const fimData = new Date(fim + "T23:59:59");

  const [oportunidades, qualificacoes, ligacoesRows, closerLancamentos, totalSdrs, totalClosers] = await Promise.all([
    prisma.sdrLancamento.count({ where: { tipoAtividade: "OPORTUNIDADE", data: { gte: inicioData, lte: fimData } } }),
    prisma.sdrLancamento.count({ where: { tipoAtividade: "QUALIFICACAO", data: { gte: inicioData, lte: fimData } } }),
    prisma.sdrProducaoDiaria.findMany({ where: { data: { gte: inicioData, lte: fimData } }, select: { ligacoes: true } }),
    prisma.closerLancamento.findMany({ where: { data: { gte: inicioData, lte: fimData } } }),
    prisma.profile.count({ where: { ativo: true, user: { role: "SDR" } } }),
    prisma.profile.count({ where: { ativo: true, user: { role: "CLOSER" } } }),
  ]);

  const ligacoes = ligacoesRows.reduce((s, r) => s + r.ligacoes, 0);
  const closerTotais = closerLancamentos.reduce(
    (acc, l) => {
      acc.oportunidades += l.oportunidadesTrabalhadas;
      acc.retornos += l.retornos;
      acc.produtivos += l.contatosProdutivos;
      acc.cotacoes += l.cotacoes;
      acc.vendas += l.vendas;
      return acc;
    },
    { oportunidades: 0, retornos: 0, produtivos: 0, cotacoes: 0, vendas: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Operação comercial</h1>
          <p className="text-sm text-muted">{label}</p>
        </div>
        <Suspense fallback={null}>
          <PeriodPicker periodoAtual={periodoKey} inicioAtual={params.inicio ?? inicio} fimAtual={params.fim ?? fim} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>SDR ({totalSdrs} ativo(s))</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Ligações" valor={ligacoes} />
            <Metric label="Oportunidades" valor={oportunidades} tom="amber" />
            <Metric label="Qualificações" valor={qualificacoes} tom="teal" />
          </div>
          <Link href="/dashboard/gerente/sdr" className="mt-4 inline-block text-xs text-accent hover:underline">
            Ver detalhes por SDR →
          </Link>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Closer ({totalClosers} ativo(s))</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Oportunidades" valor={closerTotais.oportunidades} />
            <Metric label="Retornos" valor={closerTotais.retornos} />
            <Metric label="Produtivos" valor={closerTotais.produtivos} tom="amber" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Metric label="Cotações" valor={closerTotais.cotacoes} tom="amber" />
            <Metric label="Vendas" valor={closerTotais.vendas} tom="teal" />
          </div>
          <Link href="/dashboard/gerente/closer" className="mt-4 inline-block text-xs text-accent hover:underline">
            Ver detalhes por closer →
          </Link>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relatórios completos</CardTitle>
          <p className="mt-1 text-xs text-muted">Todos os lançamentos, filtrados por pessoa e período.</p>
        </CardHeader>
        <Link href="/dashboard/gerente/relatorios" className="text-sm font-semibold text-accent hover:underline">
          Abrir relatórios →
        </Link>
      </Card>
    </div>
  );
}

function Metric({ label, valor, tom }: { label: string; valor: number; tom?: "teal" | "amber" }) {
  const cor = tom === "teal" ? "text-teal" : tom === "amber" ? "text-amber" : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-surface-2 p-3">
      <p className="mb-1 text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className={`font-num text-xl font-semibold ${cor}`}>{valor}</p>
    </div>
  );
}
