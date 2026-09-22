import { prisma } from "@/lib/prisma";
import { calcularPeriodo } from "@/lib/calculos/periodo";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PeriodPicker } from "@/components/dashboard/period-picker";
import { TIPO_ATIVIDADE_LABEL, TIPO_ATIVIDADE_TONE, TEMPERATURA_LABEL, TEMPERATURA_TONE } from "@/lib/crm/labels";
import { Suspense } from "react";
import Link from "next/link";

function dataISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function GerenteSdrDetalhePage({
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
  const inicioData = new Date(inicio);
  const fimData = new Date(fim + "T23:59:59");

  const perfil = await prisma.profile.findUnique({ where: { id } });
  if (!perfil) notFound();

  const [lancamentos, ligacoesRows] = await Promise.all([
    prisma.sdrLancamento.findMany({
      where: { sdrId: id, data: { gte: inicioData, lte: fimData } },
      orderBy: { data: "desc" },
    }),
    prisma.sdrProducaoDiaria.findMany({ where: { sdrId: id, data: { gte: inicioData, lte: fimData } } }),
  ]);

  const ligacoes = ligacoesRows.reduce((s, r) => s + r.ligacoes, 0);
  const oportunidades = lancamentos.filter((l) => l.tipoAtividade === "OPORTUNIDADE").length;
  const qualificacoes = lancamentos.filter((l) => l.tipoAtividade === "QUALIFICACAO").length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/gerente/sdr" className="text-xs text-muted hover:underline">
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

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Ligações</p>
          <p className="font-num text-2xl font-semibold">{ligacoes}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Oportunidades</p>
          <p className="font-num text-2xl font-semibold text-amber">{oportunidades}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Qualificações</p>
          <p className="font-num text-2xl font-semibold text-teal">{qualificacoes}</p>
        </Card>
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
                <th className="py-2 pr-3 font-medium">Nome</th>
                <th className="py-2 pr-3 font-medium">Telefone</th>
                <th className="py-2 pr-3 font-medium">Tipo</th>
                <th className="py-2 pr-3 font-medium">Temp.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lancamentos.map((l) => (
                <tr key={l.id}>
                  <td className="py-2 pr-3 font-num text-muted">{dataISO(l.data)}</td>
                  <td className="py-2 pr-3 font-medium">{l.nome}</td>
                  <td className="py-2 pr-3 font-num text-muted">{l.telefone || "—"}</td>
                  <td className="py-2 pr-3">
                    <Badge tone={TIPO_ATIVIDADE_TONE[l.tipoAtividade]}>{TIPO_ATIVIDADE_LABEL[l.tipoAtividade]}</Badge>
                  </td>
                  <td className="py-2 pr-3">
                    {l.temperatura ? (
                      <Badge tone={TEMPERATURA_TONE[l.temperatura]}>{TEMPERATURA_LABEL[l.temperatura]}</Badge>
                    ) : (
                      "—"
                    )}
                  </td>
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
