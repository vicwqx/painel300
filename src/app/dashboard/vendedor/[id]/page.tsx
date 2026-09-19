import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LancamentosTable } from "@/components/dashboard/lancamentos-table";
import { calcularComissao } from "@/lib/calculos/comissao";
import { inicioCiclo } from "@/lib/calculos/periodo";
import Link from "next/link";

export default async function VendedorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const perfil = await prisma.profile.findUnique({ where: { id } });
  if (!perfil) notFound();

  const hojeStr = new Date().toISOString().slice(0, 10);
  const inicioMes = new Date(inicioCiclo(hojeStr) + "T00:00:00");

  const [lancamentos, comissaoConfig] = await Promise.all([
    prisma.lancamentoDiario.findMany({
      where: { profileId: id },
      orderBy: { data: "desc" },
      take: 200,
    }),
    prisma.comissaoConfig.findUnique({ where: { cargo: perfil.cargo } }),
  ]);

  const doMes = lancamentos.filter((l) => l.data >= inicioMes);
  const totaisMes = doMes.reduce(
    (acc, l) => {
      acc.cotacoes += l.cotacoes;
      acc.ligacoes += l.ligacoes;
      acc.vendas += l.vendas;
      acc.ativas += l.ativas;
      return acc;
    },
    { cotacoes: 0, ligacoes: 0, vendas: 0, ativas: 0 }
  );

  const comissao = comissaoConfig
    ? calcularComissao(comissaoConfig, totaisMes.vendas, totaisMes.ativas)
    : null;

  const linhas = lancamentos.map((l) => ({
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
      <div>
        <Link href="/dashboard" className="text-xs text-muted hover:underline">
          ← Voltar
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-xl font-semibold">{perfil.nome}</h1>
          <Badge tone="neutral">{perfil.cargo}</Badge>
          <Badge tone={perfil.ativo ? "teal" : "neutral"}>{perfil.ativo ? "Ativo" : "Inativo"}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Cotações (mês)</p>
          <p className="font-num text-2xl font-semibold">{totaisMes.cotacoes}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Ligações (mês)</p>
          <p className="font-num text-2xl font-semibold">{totaisMes.ligacoes}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Vendas (mês)</p>
          <p className="font-num text-2xl font-semibold text-teal">{totaisMes.vendas}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Ativas (mês)</p>
          <p className="font-num text-2xl font-semibold">{totaisMes.ativas}</p>
        </Card>
      </div>

      {comissao && (
        <Card>
          <CardHeader>
            <CardTitle>Comissão do mês (estimativa)</CardTitle>
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
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">Total</p>
              <p className="font-num text-lg font-semibold text-amber">R$ {comissao.total.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de lançamentos</CardTitle>
        </CardHeader>
        <LancamentosTable linhas={linhas} mostrarNome={false} />
      </Card>
    </div>
  );
}
