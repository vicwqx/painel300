import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria } from "@/lib/crm/sessao";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function dataISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function MeusLancamentosCloserPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string; fim?: string }>;
}) {
  const sessao = await sessaoCrmObrigatoria();
  const params = await searchParams;

  const lancamentos = await prisma.closerLancamento.findMany({
    where: {
      closerId: sessao.profileId,
      data: {
        ...(params.inicio ? { gte: new Date(params.inicio) } : {}),
        ...(params.fim ? { lte: new Date(params.fim) } : {}),
      },
    },
    orderBy: { data: "desc" },
    take: 100,
  });

  const totais = lancamentos.reduce(
    (acc, l) => {
      acc.recebidas += l.oportunidadesRecebidas;
      acc.trabalhadas += l.oportunidadesTrabalhadas;
      acc.retornos += l.retornos;
      acc.produtivos += l.contatosProdutivos;
      acc.cotacoes += l.cotacoes;
      acc.vendas += l.vendas;
      return acc;
    },
    { recebidas: 0, trabalhadas: 0, retornos: 0, produtivos: 0, cotacoes: 0, vendas: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Meus lançamentos</h1>
        <p className="text-sm text-muted">{lancamentos.length} dia(s) lançado(s).</p>
      </div>

      <Card>
        <form className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted">De</label>
            <Input name="inicio" type="date" defaultValue={params.inicio} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Até</label>
            <Input name="fim" type="date" defaultValue={params.fim} />
          </div>
          <Button type="submit" className="px-4">
            Filtrar
          </Button>
          <Link href="/dashboard/closer/lancamentos" className="text-xs text-muted hover:underline">
            Limpar
          </Link>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Totais no período</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          <Total label="Recebidas" valor={totais.recebidas} />
          <Total label="Trabalhadas" valor={totais.trabalhadas} />
          <Total label="Retornos" valor={totais.retornos} />
          <Total label="Produtivos" valor={totais.produtivos} />
          <Total label="Cotações" valor={totais.cotacoes} />
          <Total label="Vendas" valor={totais.vendas} tom="teal" />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
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
                <th className="py-2 pr-3 text-right font-medium">Sem produt.</th>
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
                  <td className="py-2 pr-3 text-right font-num text-muted">{l.semProdutividade}</td>
                  <td className="py-2 pr-3 text-muted">{l.observacoes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {lancamentos.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">Nenhum lançamento encontrado.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function Total({ label, valor, tom }: { label: string; valor: number; tom?: "teal" }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-2">{label}</p>
      <p className={`font-num text-xl font-semibold ${tom === "teal" ? "text-teal" : ""}`}>{valor}</p>
    </div>
  );
}
