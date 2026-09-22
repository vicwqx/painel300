import { prisma } from "@/lib/prisma";
import { calcularPeriodo } from "@/lib/calculos/periodo";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodPicker } from "@/components/dashboard/period-picker";
import { Suspense } from "react";
import Link from "next/link";

export default async function GerenteCloserPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; inicio?: string; fim?: string }>;
}) {
  const params = await searchParams;
  const periodoKey = params.periodo ?? "mes";
  const { inicio, fim, label } = calcularPeriodo(periodoKey, params.inicio, params.fim);
  const inicioData = new Date(inicio);
  const fimData = new Date(fim + "T23:59:59");

  const closers = await prisma.profile.findMany({
    where: { ativo: true, user: { role: "CLOSER" } },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  const lancamentos = await prisma.closerLancamento.findMany({
    where: { closerId: { in: closers.map((c) => c.id) }, data: { gte: inicioData, lte: fimData } },
  });

  const linhas = closers
    .map((c) => {
      const doCloser = lancamentos.filter((l) => l.closerId === c.id);
      return {
        id: c.id,
        nome: c.nome,
        oportunidades: doCloser.reduce((s, l) => s + l.oportunidadesTrabalhadas, 0),
        retornos: doCloser.reduce((s, l) => s + l.retornos, 0),
        produtivos: doCloser.reduce((s, l) => s + l.contatosProdutivos, 0),
        cotacoes: doCloser.reduce((s, l) => s + l.cotacoes, 0),
        vendas: doCloser.reduce((s, l) => s + l.vendas, 0),
      };
    })
    .sort((a, b) => b.vendas - a.vendas);

  const totais = linhas.reduce(
    (acc, l) => {
      acc.oportunidades += l.oportunidades;
      acc.retornos += l.retornos;
      acc.produtivos += l.produtivos;
      acc.cotacoes += l.cotacoes;
      acc.vendas += l.vendas;
      return acc;
    },
    { oportunidades: 0, retornos: 0, produtivos: 0, cotacoes: 0, vendas: 0 }
  );
  const semProdutividade = lancamentos.reduce((s, l) => s + l.semProdutividade, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Dashboard Closer</h1>
          <p className="text-sm text-muted">{label}</p>
        </div>
        <Suspense fallback={null}>
          <PeriodPicker periodoAtual={periodoKey} inicioAtual={params.inicio ?? inicio} fimAtual={params.fim ?? fim} />
        </Suspense>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Oportunidades</p>
          <p className="font-num text-2xl font-semibold">{totais.oportunidades}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Retornos</p>
          <p className="font-num text-2xl font-semibold">{totais.retornos}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Produtivos</p>
          <p className="font-num text-2xl font-semibold text-amber">{totais.produtivos}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Cotações</p>
          <p className="font-num text-2xl font-semibold text-amber">{totais.cotacoes}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Vendas</p>
          <p className="font-num text-2xl font-semibold text-teal">{totais.vendas}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Sem produtividade</p>
          <p className="font-num text-2xl font-semibold text-red">{semProdutividade}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Por closer</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-2">
                <th className="py-2 font-medium">Closer</th>
                <th className="py-2 text-right font-medium">Oportunidades</th>
                <th className="py-2 text-right font-medium">Retornos</th>
                <th className="py-2 text-right font-medium">Produtivos</th>
                <th className="py-2 text-right font-medium">Cotações</th>
                <th className="py-2 text-right font-medium">Vendas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {linhas.map((l) => (
                <tr key={l.id}>
                  <td className="py-2.5 font-medium">
                    <Link href={`/dashboard/gerente/closer/${l.id}?${new URLSearchParams({ periodo: periodoKey, inicio, fim }).toString()}`} className="hover:text-accent hover:underline">
                      {l.nome}
                    </Link>
                  </td>
                  <td className="py-2.5 text-right font-num">{l.oportunidades}</td>
                  <td className="py-2.5 text-right font-num">{l.retornos}</td>
                  <td className="py-2.5 text-right font-num">{l.produtivos}</td>
                  <td className="py-2.5 text-right font-num">{l.cotacoes}</td>
                  <td className="py-2.5 text-right font-num font-semibold text-teal">{l.vendas}</td>
                </tr>
              ))}
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted">
                    Nenhum closer ativo cadastrado ainda.
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
