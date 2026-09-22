import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria } from "@/lib/crm/sessao";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CloserTrendChart, type PontoCloser } from "./closer-trend-chart";
import { somarDias } from "@/lib/calculos/periodo";
import Link from "next/link";

function isoHoje() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
function inicioDaSemanaStr(hoje: string) {
  const d = new Date(hoje + "T00:00:00");
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  return somarDias(hoje, diff);
}
function inicioDoMesStr(hoje: string) {
  return hoje.slice(0, 7) + "-01";
}

async function somarPeriodo(closerId: string, inicio: string, fim: string) {
  const linhas = await prisma.closerLancamento.findMany({
    where: { closerId, data: { gte: new Date(inicio), lte: new Date(fim) } },
  });
  return linhas.reduce(
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
}

export default async function CloserPage() {
  const sessao = await sessaoCrmObrigatoria();
  const hoje = isoHoje();
  const inicioSemana = inicioDaSemanaStr(hoje);
  const inicioMes = inicioDoMesStr(hoje);

  const [dadosHoje, dadosSemana, dadosMes, ultimos7Raw] = await Promise.all([
    somarPeriodo(sessao.profileId, hoje, hoje),
    somarPeriodo(sessao.profileId, inicioSemana, hoje),
    somarPeriodo(sessao.profileId, inicioMes, hoje),
    prisma.closerLancamento.findMany({
      where: { closerId: sessao.profileId, data: { gte: new Date(somarDias(hoje, -6)), lte: new Date(hoje) } },
      orderBy: { data: "asc" },
    }),
  ]);

  const porDia = new Map(
    Array.from({ length: 7 }, (_, i) => somarDias(hoje, i - 6)).map((d) => [d, { oportunidades: 0, cotacoes: 0, vendas: 0 }])
  );
  for (const l of ultimos7Raw) {
    const chave = l.data.toISOString().slice(0, 10);
    const acc = porDia.get(chave);
    if (!acc) continue;
    acc.oportunidades += l.oportunidadesTrabalhadas;
    acc.cotacoes += l.cotacoes;
    acc.vendas += l.vendas;
  }
  const ultimos7: PontoCloser[] = Array.from(porDia.entries()).map(([dia, v]) => ({
    dia: dia.slice(5).split("-").reverse().join("/"),
    ...v,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Olá, {sessao.nome.split(" ")[0]}</h1>
          <p className="text-sm text-muted">Sua produtividade.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/closer/lancamento"
            className="inline-flex items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-sm font-semibold text-[#04211d] transition-colors hover:bg-accent-strong"
          >
            Lançamento de hoje
          </Link>
          <Link
            href="/dashboard/closer/lancamentos"
            className="inline-flex items-center gap-2 rounded-md border border-border-strong px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-surface-3"
          >
            Meus lançamentos
          </Link>
        </div>
      </div>

      {[
        { titulo: "Hoje", dados: dadosHoje },
        { titulo: "Semana", dados: dadosSemana },
        { titulo: "Mês", dados: dadosMes },
      ].map((bloco) => (
        <div key={bloco.titulo}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-2">{bloco.titulo}</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Card className="p-4">
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Oportunidades</p>
              <p className="font-num text-2xl font-semibold">{bloco.dados.oportunidades}</p>
            </Card>
            <Card className="p-4">
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Retornos</p>
              <p className="font-num text-2xl font-semibold">{bloco.dados.retornos}</p>
            </Card>
            <Card className="p-4">
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Produtivos</p>
              <p className="font-num text-2xl font-semibold text-amber">{bloco.dados.produtivos}</p>
            </Card>
            <Card className="p-4">
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Cotações</p>
              <p className="font-num text-2xl font-semibold text-amber">{bloco.dados.cotacoes}</p>
            </Card>
            <Card className="p-4">
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Vendas</p>
              <p className="font-num text-2xl font-semibold text-teal">{bloco.dados.vendas}</p>
            </Card>
          </div>
        </div>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Últimos 7 dias</CardTitle>
        </CardHeader>
        <CloserTrendChart dados={ultimos7} />
      </Card>
    </div>
  );
}
