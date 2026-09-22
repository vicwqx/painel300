import { prisma } from "@/lib/prisma";
import { calcularPeriodo } from "@/lib/calculos/periodo";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodPicker } from "@/components/dashboard/period-picker";
import { Suspense } from "react";
import Link from "next/link";

export default async function GerenteSdrPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; inicio?: string; fim?: string }>;
}) {
  const params = await searchParams;
  const periodoKey = params.periodo ?? "mes";
  const { inicio, fim, label } = calcularPeriodo(periodoKey, params.inicio, params.fim);
  const inicioData = new Date(inicio);
  const fimData = new Date(fim + "T23:59:59");

  const sdrs = await prisma.profile.findMany({
    where: { ativo: true, user: { role: "SDR" } },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  const [lancamentos, ligacoesRows] = await Promise.all([
    prisma.sdrLancamento.findMany({
      where: { sdrId: { in: sdrs.map((s) => s.id) }, data: { gte: inicioData, lte: fimData } },
      select: { sdrId: true, tipoAtividade: true },
    }),
    prisma.sdrProducaoDiaria.findMany({
      where: { sdrId: { in: sdrs.map((s) => s.id) }, data: { gte: inicioData, lte: fimData } },
      select: { sdrId: true, ligacoes: true },
    }),
  ]);

  const linhas = sdrs
    .map((s) => {
      const doSdr = lancamentos.filter((l) => l.sdrId === s.id);
      const ligacoes = ligacoesRows.filter((r) => r.sdrId === s.id).reduce((sum, r) => sum + r.ligacoes, 0);
      const oportunidades = doSdr.filter((l) => l.tipoAtividade === "OPORTUNIDADE").length;
      const qualificacoes = doSdr.filter((l) => l.tipoAtividade === "QUALIFICACAO").length;
      return { id: s.id, nome: s.nome, ligacoes, oportunidades, qualificacoes };
    })
    .sort((a, b) => b.ligacoes - a.ligacoes);

  const totalLigacoes = linhas.reduce((s, l) => s + l.ligacoes, 0);
  const totalOportunidades = linhas.reduce((s, l) => s + l.oportunidades, 0);
  const totalQualificacoes = linhas.reduce((s, l) => s + l.qualificacoes, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Dashboard SDR</h1>
          <p className="text-sm text-muted">{label}</p>
        </div>
        <Suspense fallback={null}>
          <PeriodPicker periodoAtual={periodoKey} inicioAtual={params.inicio ?? inicio} fimAtual={params.fim ?? fim} />
        </Suspense>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Total de ligações</p>
          <p className="font-num text-2xl font-semibold">{totalLigacoes}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Total de oportunidades</p>
          <p className="font-num text-2xl font-semibold text-amber">{totalOportunidades}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Total de qualificações</p>
          <p className="font-num text-2xl font-semibold text-teal">{totalQualificacoes}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Por SDR</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-2">
                <th className="py-2 font-medium">SDR</th>
                <th className="py-2 text-right font-medium">Ligações</th>
                <th className="py-2 text-right font-medium">Oportunidades</th>
                <th className="py-2 text-right font-medium">Qualificações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {linhas.map((l) => (
                <tr key={l.id}>
                  <td className="py-2.5 font-medium">
                    <Link href={`/dashboard/gerente/sdr/${l.id}?${new URLSearchParams({ periodo: periodoKey, inicio, fim }).toString()}`} className="hover:text-accent hover:underline">
                      {l.nome}
                    </Link>
                  </td>
                  <td className="py-2.5 text-right font-num">{l.ligacoes}</td>
                  <td className="py-2.5 text-right font-num text-amber">{l.oportunidades}</td>
                  <td className="py-2.5 text-right font-num text-teal">{l.qualificacoes}</td>
                </tr>
              ))}
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-muted">
                    Nenhum SDR ativo cadastrado ainda.
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
