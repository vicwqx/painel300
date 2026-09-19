import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { projecaoLinear } from "@/lib/calculos/metas";
import { SimuladorCenarios } from "./simulador";
import { MapaEstrelados } from "./mapa-estrelados";
import { CampanhasPanel } from "./campanhas";
import { LeadsPanel } from "./leads";
import { BarraPorVendedor } from "@/components/dashboard/barra-por-vendedor";
import { inicioCiclo, fimCiclo } from "@/lib/calculos/periodo";

const META_MENSAL_PADRAO = 300;

function isoHoje() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
function somarDias(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
function dataISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function GestorPage() {
  const hojeStr = isoHoje();
  const inicioCicloStr = inicioCiclo(hojeStr);
  const fimCicloStr = fimCiclo(inicioCicloStr);
  const inicioMes = new Date(inicioCicloStr + "T00:00:00");
  const dayOfMonth =
    Math.floor((new Date(hojeStr + "T00:00:00").getTime() - inicioMes.getTime()) / 86400000) + 1;
  const totalDaysInMonth =
    Math.floor((new Date(fimCicloStr + "T00:00:00").getTime() - inicioMes.getTime()) / 86400000) + 1;
  const janela60 = somarDias(hojeStr, -60);

  const [profiles, metaConfig, lancamentos60, campanhasRaw, leadsRaw] = await Promise.all([
    prisma.profile.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.metaMensal.findFirst({ where: { vigencia: inicioMes } }),
    prisma.lancamentoDiario.findMany({
      where: { data: { gte: new Date(janela60) } },
      select: { profileId: true, data: true, cotacoes: true, ligacoes: true, vendas: true, ativas: true },
      orderBy: { data: "asc" },
    }),
    prisma.campanha.findMany({
      include: { participantes: true },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.lead.findMany({
      select: { id: true, profileId: true, nomeLead: true, telefone: true, placa: true, status: true, origemContato: true },
      orderBy: { criadoEm: "desc" },
    }),
  ]);

  const metaVendas = metaConfig?.metaVendas ?? META_MENSAL_PADRAO;
  const pessoas = profiles.map((p) => ({ id: p.id, nome: p.nome }));

  const entradas = lancamentos60.map((l) => ({
    profileId: l.profileId,
    data: dataISO(l.data),
    cotacoes: l.cotacoes,
    ligacoes: l.ligacoes,
    vendas: l.vendas,
    ativas: l.ativas,
  }));

  // --- Meta do mês / simulador ---
  const doMes = entradas.filter((e) => e.data >= dataISO(inicioMes) && e.data <= hojeStr);
  const vendasMTD = doMes.reduce((s, e) => s + e.vendas, 0);
  const ligacoesMTD = doMes.reduce((s, e) => s + e.ligacoes, 0);
  const cotacoesMTD = doMes.reduce((s, e) => s + e.cotacoes, 0);
  const teamSize = Math.max(1, pessoas.length);
  const convLC = ligacoesMTD > 0 ? cotacoesMTD / ligacoesMTD : 0;
  const convCV = cotacoesMTD > 0 ? vendasMTD / cotacoesMTD : 0;
  const avgLigacoesPerRepPerDay = teamSize * dayOfMonth > 0 ? ligacoesMTD / (teamSize * dayOfMonth) : 0;
  const daysLeft = totalDaysInMonth - dayOfMonth;
  const projecaoAtual = projecaoLinear(vendasMTD, dayOfMonth, totalDaysInMonth);

  // --- Radar de risco: últimos 7 dias vs 7 anteriores ---
  const inicioUltimos7 = somarDias(hojeStr, -6);
  const inicioAnteriores7 = somarDias(hojeStr, -13);
  const fimAnteriores7 = somarDias(hojeStr, -7);

  const risco = pessoas
    .map((p) => {
      let vendasUltimos7 = 0,
        vendasAnteriores7 = 0,
        diasUltimos7 = 0,
        diasAnteriores7 = 0;
      for (const e of entradas) {
        if (e.profileId !== p.id) continue;
        if (e.data >= inicioUltimos7 && e.data <= hojeStr) {
          vendasUltimos7 += e.vendas;
          diasUltimos7++;
        }
        if (e.data >= inicioAnteriores7 && e.data <= fimAnteriores7) {
          vendasAnteriores7 += e.vendas;
          diasAnteriores7++;
        }
      }
      let motivo: string | null = null;
      if (vendasAnteriores7 >= 2 && vendasUltimos7 <= vendasAnteriores7 * 0.5) {
        const pct = Math.round((1 - vendasUltimos7 / vendasAnteriores7) * 100);
        motivo = `Vendas caíram ${pct}% (${vendasAnteriores7} → ${vendasUltimos7}) vs. as 2 semanas anteriores`;
      } else if (diasAnteriores7 >= 4 && diasUltimos7 <= Math.floor(diasAnteriores7 * 0.5)) {
        motivo = `Parou de lançar dados com frequência (${diasAnteriores7} → ${diasUltimos7} dias ativos)`;
      }
      return { nome: p.nome, motivo };
    })
    .filter((r) => r.motivo);

  // --- Campanhas ---
  const campanhas = campanhasRaw.map((c) => ({
    id: c.id,
    nome: c.nome,
    metaValor: c.metaValor,
    inicio: dataISO(c.inicio),
    fim: dataISO(c.fim),
    participanteIds: c.participantes.map((p) => p.profileId),
  }));
  const entradasCotacoes = entradas.map((e) => ({ profileId: e.profileId, data: e.data, cotacoes: e.cotacoes }));

  const leads = leadsRaw.map((l) => ({ ...l }));

  // --- Vendas / ligações por vendedor (mês atual) ---
  const vendasPorPessoa = pessoas.map((p) => ({
    nome: p.nome,
    valor: doMes.filter((e) => e.profileId === p.id).reduce((s, e) => s + e.vendas, 0),
  }));
  const ligacoesPorPessoa = pessoas.map((p) => ({
    nome: p.nome,
    valor: doMes.filter((e) => e.profileId === p.id).reduce((s, e) => s + e.ligacoes, 0),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Painel do gestor</h1>
        <p className="text-sm text-muted">Visão consolidada da equipe.</p>
      </div>

      <SimuladorCenarios
        teamSize={teamSize}
        vendasMTD={vendasMTD}
        avgLigacoesPerRepPerDay={avgLigacoesPerRepPerDay}
        convLC={convLC}
        convCV={convCV}
        daysLeft={daysLeft}
        metaVendas={metaVendas}
        projecaoAtual={projecaoAtual}
      />

      <Card>
        <CardHeader>
          <CardTitle>Radar de risco</CardTitle>
          <p className="mt-1 text-xs text-muted">
            Quem caiu de ritmo nos últimos 7 dias comparado às 2 semanas anteriores.
          </p>
        </CardHeader>
        {risco.length === 0 ? (
          <p className="text-sm text-muted">Nenhum sinal de queda relevante nas últimas 2 semanas.</p>
        ) : (
          <div className="divide-y divide-border">
            {risco.map((r) => (
              <div key={r.nome} className="flex items-start gap-2.5 py-2.5">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red" />
                <div>
                  <div className="text-sm font-medium">{r.nome}</div>
                  <div className="text-xs text-muted">{r.motivo}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <MapaEstrelados pessoas={pessoas} entradas={entradas} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por vendedor (mês)</CardTitle>
          </CardHeader>
          <BarraPorVendedor dados={vendasPorPessoa} cor="#00D9A3" />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ligações por vendedor (mês)</CardTitle>
          </CardHeader>
          <BarraPorVendedor dados={ligacoesPorPessoa} cor="#4C9FFF" />
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Campanhas</h2>
        <CampanhasPanel campanhas={campanhas} pessoas={pessoas} entradas={entradasCotacoes} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Controle de leads</h2>
        <LeadsPanel pessoas={pessoas} leads={leads} />
      </div>
    </div>
  );
}
