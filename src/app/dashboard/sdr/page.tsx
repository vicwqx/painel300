import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria } from "@/lib/crm/sessao";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LigacoesWidget } from "./ligacoes-widget";
import { SdrTrendChart, type PontoSdr } from "./sdr-trend-chart";
import { TEMPERATURA_LABEL, TEMPERATURA_EMOJI } from "@/lib/crm/labels";
import { somarDias } from "@/lib/calculos/periodo";
import Link from "next/link";
import type { Temperatura } from "@prisma/client";

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

async function contarPeriodo(sdrId: string, inicio: string, fim: string) {
  const [oportunidades, qualificacoes, ligacoesRows] = await Promise.all([
    prisma.sdrLancamento.count({
      where: { sdrId, tipoAtividade: "OPORTUNIDADE", data: { gte: new Date(inicio), lte: new Date(fim + "T23:59:59") } },
    }),
    prisma.sdrLancamento.count({
      where: { sdrId, tipoAtividade: "QUALIFICACAO", data: { gte: new Date(inicio), lte: new Date(fim + "T23:59:59") } },
    }),
    prisma.sdrProducaoDiaria.findMany({
      where: { sdrId, data: { gte: new Date(inicio), lte: new Date(fim + "T23:59:59") } },
      select: { ligacoes: true },
    }),
  ]);
  const ligacoes = ligacoesRows.reduce((s, r) => s + r.ligacoes, 0);
  return { oportunidades, qualificacoes, ligacoes };
}

const TEMPERATURAS: Temperatura[] = ["QUENTE", "MORNO", "FRIO"];

export default async function SdrPage() {
  const sessao = await sessaoCrmObrigatoria();
  const hoje = isoHoje();
  const inicioSemana = inicioDaSemanaStr(hoje);
  const inicioMes = inicioDoMesStr(hoje);

  const [dadosHoje, dadosSemana, dadosMes, ligacoesHojeRow, totalLeadsMes, temperaturaRows, ultimos7Raw] =
    await Promise.all([
      contarPeriodo(sessao.profileId, hoje, hoje),
      contarPeriodo(sessao.profileId, inicioSemana, hoje),
      contarPeriodo(sessao.profileId, inicioMes, hoje),
      prisma.sdrProducaoDiaria.findUnique({ where: { sdrId_data: { sdrId: sessao.profileId, data: new Date(hoje) } } }),
      prisma.sdrLancamento.count({
        where: { sdrId: sessao.profileId, data: { gte: new Date(inicioMes) } },
      }),
      prisma.sdrLancamento.groupBy({
        by: ["temperatura"],
        where: { sdrId: sessao.profileId, data: { gte: new Date(inicioMes) }, temperatura: { not: null } },
        _count: { _all: true },
      }),
      Promise.all(
        Array.from({ length: 7 }, (_, i) => somarDias(hoje, i - 6)).map(async (dia) => {
          const c = await contarPeriodo(sessao.profileId, dia, dia);
          return { dia: dia.slice(5).split("-").reverse().join("/"), ...c };
        })
      ),
    ]);

  const ultimos7: PontoSdr[] = ultimos7Raw;
  const temperaturaMap = new Map(temperaturaRows.map((r) => [r.temperatura, r._count._all]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Olá, {sessao.nome.split(" ")[0]}</h1>
          <p className="text-sm text-muted">Sua produtividade.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/sdr/lancamento"
            className="inline-flex items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-sm font-semibold text-[#04211d] transition-colors hover:bg-accent-strong"
          >
            + Novo lançamento
          </Link>
          <Link
            href="/dashboard/sdr/lancamentos"
            className="inline-flex items-center gap-2 rounded-md border border-border-strong px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-surface-3"
          >
            Meus lançamentos
          </Link>
        </div>
      </div>

      <Card>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Ligações de hoje</p>
        <LigacoesWidget ligacoesHoje={ligacoesHojeRow?.ligacoes ?? 0} />
      </Card>

      {[
        { titulo: "Hoje", dados: dadosHoje },
        { titulo: "Semana", dados: dadosSemana },
        { titulo: "Mês", dados: dadosMes },
      ].map((bloco) => (
        <div key={bloco.titulo}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-2">{bloco.titulo}</p>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4">
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Ligações</p>
              <p className="font-num text-2xl font-semibold">{bloco.dados.ligacoes}</p>
            </Card>
            <Card className="p-4">
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Oportunidades</p>
              <p className="font-num text-2xl font-semibold text-amber">{bloco.dados.oportunidades}</p>
            </Card>
            <Card className="p-4">
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Qualificações</p>
              <p className="font-num text-2xl font-semibold text-teal">{bloco.dados.qualificacoes}</p>
            </Card>
          </div>
        </div>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Últimos 7 dias</CardTitle>
        </CardHeader>
        <SdrTrendChart dados={ultimos7} />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leads do mês</CardTitle>
        </CardHeader>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted">Total cadastrado</p>
            <p className="font-num text-2xl font-semibold">{totalLeadsMes}</p>
          </div>
          <div className="flex gap-3">
            {TEMPERATURAS.map((t) => (
              <div key={t} className="text-center">
                <p className="text-lg">{TEMPERATURA_EMOJI[t]}</p>
                <p className="font-num text-sm font-semibold">{temperaturaMap.get(t) ?? 0}</p>
                <p className="text-[10px] text-muted-2">{TEMPERATURA_LABEL[t]}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
