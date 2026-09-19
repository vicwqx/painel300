import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LancamentosTable } from "@/components/dashboard/lancamentos-table";
import { calcularComissao } from "@/lib/calculos/comissao";
import { inicioCiclo, fimCiclo } from "@/lib/calculos/periodo";
import { REGRA_ESTRELA_SEMANAL, segundaFeiraDaSemana } from "@/lib/calculos/metas";

function dataISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function MeusNumerosPage() {
  const session = await auth();
  const profileId = (session?.user as { profileId?: string } | undefined)?.profileId;

  if (!profileId) {
    return (
      <div className="max-w-lg">
        <Card>
          <p className="text-sm text-muted">
            Seu usuário não tem um perfil operacional vinculado. Fale com o gestor.
          </p>
        </Card>
      </div>
    );
  }

  const perfil = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!perfil) {
    return (
      <div className="max-w-lg">
        <Card>
          <p className="text-sm text-muted">Perfil não encontrado.</p>
        </Card>
      </div>
    );
  }

  const hoje = new Date();
  const hojeStr = dataISO(hoje);
  const inicioSemana = dataISO(segundaFeiraDaSemana(hoje));
  const inicioMesStr = inicioCiclo(hojeStr);
  const fimMesStr = fimCiclo(inicioMesStr);

  const [lancamentosDoMes, comissaoConfig, historico] = await Promise.all([
    prisma.lancamentoDiario.findMany({
      where: { profileId, data: { gte: new Date(inicioMesStr), lte: new Date(hojeStr) } },
      orderBy: { data: "asc" },
    }),
    prisma.comissaoConfig.findUnique({ where: { cargo: perfil.cargo } }),
    prisma.lancamentoDiario.findMany({
      where: { profileId },
      orderBy: { data: "desc" },
      take: 60,
    }),
  ]);

  const totaisMes = lancamentosDoMes.reduce(
    (acc, l) => {
      acc.prospeccoes += l.prospeccoes;
      acc.indicacoes += l.indicacoes;
      acc.ligacoes += l.ligacoes;
      acc.atendidas += l.atendidas;
      acc.cotacoes += l.cotacoes;
      acc.followup += l.followup;
      acc.vendas += l.vendas;
      acc.ativas += l.ativas;
      return acc;
    },
    { prospeccoes: 0, indicacoes: 0, ligacoes: 0, atendidas: 0, cotacoes: 0, followup: 0, vendas: 0, ativas: 0 }
  );

  const totaisSemana = lancamentosDoMes
    .filter((l) => dataISO(l.data) >= inicioSemana && dataISO(l.data) <= hojeStr)
    .reduce(
      (acc, l) => {
        acc.cotacoes += l.cotacoes;
        acc.ativas += l.ativas;
        acc.ligacoes += l.ligacoes;
        acc.vendas += l.vendas;
        return acc;
      },
      { cotacoes: 0, ativas: 0, ligacoes: 0, vendas: 0 }
    );

  const atingiuEstrela =
    totaisSemana.cotacoes >= REGRA_ESTRELA_SEMANAL.cotacoes && totaisSemana.ativas >= REGRA_ESTRELA_SEMANAL.ativas;

  const comissao = comissaoConfig ? calcularComissao(comissaoConfig, totaisMes.vendas, totaisMes.ativas) : null;

  const conversaoMes = totaisMes.cotacoes > 0 ? (totaisMes.vendas / totaisMes.cotacoes) * 100 : 0;

  const linhas = historico.map((l) => ({
    id: l.id,
    data: l.data.toISOString().slice(0, 10),
    prospeccoes: l.prospeccoes,
    indicacoes: l.indicacoes,
    ligacoes: l.ligacoes,
    atendidas: l.atendidas,
    cotacoes: l.cotacoes,
    followup: l.followup,
    vendas: l.vendas,
    ativas: l.ativas,
    criadoEm: l.criadoEm.toISOString(),
    atualizadoEm: l.atualizadoEm.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">Meus números</h1>
        <Badge tone="neutral">{perfil.cargo}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semana atual</CardTitle>
          <p className="mt-1 text-xs text-muted">
            Segunda a domingo · meta pra estrela: {REGRA_ESTRELA_SEMANAL.cotacoes} cotações e{" "}
            {REGRA_ESTRELA_SEMANAL.ativas} ativas
          </p>
        </CardHeader>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniKpi label="Cotações" valor={totaisSemana.cotacoes} meta={REGRA_ESTRELA_SEMANAL.cotacoes} />
          <MiniKpi label="Ativas" valor={totaisSemana.ativas} meta={REGRA_ESTRELA_SEMANAL.ativas} />
          <MiniKpi label="Ligações" valor={totaisSemana.ligacoes} />
          <MiniKpi label="Vendas" valor={totaisSemana.vendas} tom="teal" />
        </div>
        {atingiuEstrela ? (
          <div className="flex items-center gap-2 rounded-md border border-amber/30 bg-amber/10 px-3 py-2 text-sm text-amber">
            ⭐ Você bateu a estrela da semana!
          </div>
        ) : (
          <p className="text-xs text-muted">
            Faltam {Math.max(0, REGRA_ESTRELA_SEMANAL.cotacoes - totaisSemana.cotacoes)} cotações e{" "}
            {Math.max(0, REGRA_ESTRELA_SEMANAL.ativas - totaisSemana.ativas)} ativas pra estrela.
          </p>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mês atual</CardTitle>
          <p className="mt-1 text-xs text-muted">
            {inicioMesStr} a {fimMesStr}
          </p>
        </CardHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniKpi label="Prospecções" valor={totaisMes.prospeccoes} />
          <MiniKpi label="Cotações" valor={totaisMes.cotacoes} />
          <MiniKpi label="Ligações" valor={totaisMes.ligacoes} />
          <MiniKpi label="Vendas" valor={totaisMes.vendas} tom="teal" />
          <MiniKpi label="Indicações" valor={totaisMes.indicacoes} />
          <MiniKpi label="Atendidas" valor={totaisMes.atendidas} />
          <MiniKpi label="Followup" valor={totaisMes.followup} />
          <MiniKpi label="Conversão" valor={Math.round(conversaoMes * 10) / 10} sufixo="%" tom="amber" />
        </div>
      </Card>

      {comissao && (
        <Card>
          <CardHeader>
            <CardTitle>Minha comissão (estimativa do mês)</CardTitle>
            <p className="mt-1 text-xs text-muted">
              Ponto de virada: {comissao.pontoDeVirada} vendas · depois disso, cada venda extra vale o ticket médio.
            </p>
          </CardHeader>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">Fixo</p>
              <p className="font-num text-lg font-semibold">R$ {comissao.fixo.toLocaleString("pt-BR")}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">Extra por vendas</p>
              <p className="font-num text-lg font-semibold">R$ {comissao.comissaoExtra.toLocaleString("pt-BR")}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">Bônus de ativas</p>
              <p className={`font-num text-lg font-semibold ${comissao.bonusAtingido ? "text-teal" : "text-muted"}`}>
                R$ {comissao.bonusValor.toLocaleString("pt-BR")}
                {!comissao.bonusAtingido && (
                  <span className="ml-1 text-[10px] text-muted-2">
                    (faltam {Math.max(0, comissaoConfig!.bonusAtivasLimite - totaisMes.ativas)} ativas)
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">Total estimado</p>
              <p className="font-num text-lg font-semibold text-amber">R$ {comissao.total.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Meu histórico</CardTitle>
        </CardHeader>
        <LancamentosTable linhas={linhas} mostrarNome={false} />
      </Card>
    </div>
  );
}

function MiniKpi({
  label,
  valor,
  meta,
  sufixo = "",
  tom,
}: {
  label: string;
  valor: number;
  meta?: number;
  sufixo?: string;
  tom?: "teal" | "amber";
}) {
  const cor = tom === "teal" ? "text-teal" : tom === "amber" ? "text-amber" : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-surface-2 p-3">
      <p className="mb-1 text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className={`font-num text-xl font-semibold ${cor}`}>
        {valor}
        {sufixo}
        {meta !== undefined && <span className="ml-1 text-xs font-normal text-muted-2">/ {meta}</span>}
      </p>
    </div>
  );
}
