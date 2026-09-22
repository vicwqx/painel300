import { prisma } from "@/lib/prisma";
import { calcularPeriodo } from "@/lib/calculos/periodo";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodPicker } from "@/components/dashboard/period-picker";
import { Suspense } from "react";
import Link from "next/link";

function dataISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function GerenteCloserDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periodo?: string; inicio?: string; fim?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const periodoKey = sp.periodo ?? "mes";
  const { inicio, fim, label } = calcularPeriodo(periodoKey, sp.inicio, sp.fim);

  const perfil = await prisma.profile.findUnique({ where: { id } });
  if (!perfil) notFound();

  const lancamentos = await prisma.closerLancamento.findMany({
    where: { closerId: id, data: { gte: new Date(inicio), lte: new Date(fim + "T23:59:59") } },
    orderBy: { data: "desc" },
  });

  const totais = lancamentos.reduce(
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
      <div>
        <Link href="/dashboard/gerente/closer" className="text-xs text-muted hover:underline">
          ← Voltar
        </Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-xl font-semibold">{perfil.nome}</h1>
          <Suspense fallback={null}>
            <PeriodPicker periodoAtual={periodoKey} inicioAtual={sp.inicio ?? inicio} fimAtual={sp.fim ?? fim} />
          </Suspense>
        </div>
        <p className="text-sm text-muted">{label}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Metric label="Oportunidades" valor={totais.oportunidades} />
        <Metric label="Retornos" valor={totais.retornos} />
        <Metric label="Produtivos" valor={totais.produtivos} tom="amber" />
        <Metric label="Cotações" valor={totais.cotacoes} tom="amber" />
        <Metric label="Vendas" valor={totais.vendas} tom="teal" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos no período</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="py-2 pr-3 font-medium">Data</th>
                <th className="py-2 pr-3 text-right font-medium">Receb.</th>
                <th className="py-2 pr-3 text-right font-medium">Trab.</th>
                <th className="py-2 pr-3 text-right font-medium">Retornos</th>
                <th className="py-2 pr-3 text-right font-medium">Produtivos</th>
                <th className="py-2 pr-3 text-right font-medium">Cotações</th>
                <th className="py-2 pr-3 text-right font-medium">Vendas</th>
                <th className="py-2 pr-3 font-medium">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lancamentos.map((l) => (
                <tr key={l.id}>
                  <td className="py-2 pr-3 font-num text-muted">{dataISO(l.data)}</td>
                  <td className="py-2 pr-3 text-right font-num">{l.oportunidadesRecebidas}</td>
                  <td className="py-2 pr-3 text-right font-num">{l.oportunidadesTrabalhadas}</td>
                  <td className="py-2 pr-3 text-right font-num">{l.retornos}</td>
                  <td className="py-2 pr-3 text-right font-num">{l.contatosProdutivos}</td>
                  <td className="py-2 pr-3 text-right font-num">{l.cotacoes}</td>
                  <td className="py-2 pr-3 text-right font-num font-semibold text-teal">{l.vendas}</td>
                  <td className="py-2 pr-3 text-muted">{l.observacoes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {lancamentos.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">Nenhum lançamento nesse período.</p>
          )}
        </div>
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
