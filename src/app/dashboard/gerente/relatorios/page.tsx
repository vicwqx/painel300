import { prisma } from "@/lib/prisma";
import { calcularPeriodo } from "@/lib/calculos/periodo";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PeriodPicker } from "@/components/dashboard/period-picker";
import { Suspense } from "react";

type LinhaRelatorio = {
  data: string;
  usuario: string;
  funcao: "SDR" | "Closer";
  atividade: string;
  quantidade: number;
};

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ quem?: string; periodo?: string; inicio?: string; fim?: string }>;
}) {
  const params = await searchParams;
  const quem = params.quem ?? "todos";
  const periodoKey = params.periodo ?? "mes";
  const { inicio, fim, label } = calcularPeriodo(periodoKey, params.inicio, params.fim);
  const inicioData = new Date(inicio);
  const fimData = new Date(fim + "T23:59:59");

  const linhas: LinhaRelatorio[] = [];

  if (quem === "todos" || quem === "sdr") {
    const [lancamentos, producao] = await Promise.all([
      prisma.sdrLancamento.findMany({
        where: { data: { gte: inicioData, lte: fimData } },
        include: { sdr: { select: { nome: true } } },
      }),
      prisma.sdrProducaoDiaria.findMany({
        where: { data: { gte: inicioData, lte: fimData }, ligacoes: { gt: 0 } },
        include: { sdr: { select: { nome: true } } },
      }),
    ]);

    const porPessoaData = new Map<string, { nome: string; data: string; oportunidades: number; qualificacoes: number }>();
    for (const l of lancamentos) {
      const dia = l.data.toISOString().slice(0, 10);
      const chave = `${l.sdrId}-${dia}`;
      const atual = porPessoaData.get(chave) ?? { nome: l.sdr.nome, data: dia, oportunidades: 0, qualificacoes: 0 };
      if (l.tipoAtividade === "OPORTUNIDADE") atual.oportunidades++;
      else atual.qualificacoes++;
      porPessoaData.set(chave, atual);
    }
    for (const { nome, data, oportunidades, qualificacoes } of porPessoaData.values()) {
      if (oportunidades > 0) linhas.push({ data, usuario: nome, funcao: "SDR", atividade: "Oportunidades", quantidade: oportunidades });
      if (qualificacoes > 0) linhas.push({ data, usuario: nome, funcao: "SDR", atividade: "Qualificações", quantidade: qualificacoes });
    }
    for (const p of producao) {
      linhas.push({
        data: p.data.toISOString().slice(0, 10),
        usuario: p.sdr.nome,
        funcao: "SDR",
        atividade: "Ligações",
        quantidade: p.ligacoes,
      });
    }
  }

  if (quem === "todos" || quem === "closer") {
    const lancamentos = await prisma.closerLancamento.findMany({
      where: { data: { gte: inicioData, lte: fimData } },
      include: { closer: { select: { nome: true } } },
    });
    const metricas: { chave: keyof (typeof lancamentos)[number]; label: string }[] = [
      { chave: "oportunidadesTrabalhadas", label: "Oportunidades" },
      { chave: "retornos", label: "Retornos" },
      { chave: "contatosProdutivos", label: "Contatos produtivos" },
      { chave: "cotacoes", label: "Cotações" },
      { chave: "vendas", label: "Vendas" },
      { chave: "semProdutividade", label: "Sem produtividade" },
    ];
    for (const l of lancamentos) {
      const dia = l.data.toISOString().slice(0, 10);
      for (const m of metricas) {
        const valor = l[m.chave] as number;
        if (valor > 0) linhas.push({ data: dia, usuario: l.closer.nome, funcao: "Closer", atividade: m.label, quantidade: valor });
      }
    }
  }

  linhas.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : a.usuario.localeCompare(b.usuario)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Relatórios</h1>
          <p className="text-sm text-muted">{label}</p>
        </div>
        <Suspense fallback={null}>
          <PeriodPicker periodoAtual={periodoKey} inicioAtual={params.inicio ?? inicio} fimAtual={params.fim ?? fim} />
        </Suspense>
      </div>

      <Card>
        <form className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="periodo" value={periodoKey} />
          {periodoKey === "personalizado" && (
            <>
              <input type="hidden" name="inicio" value={inicio} />
              <input type="hidden" name="fim" value={fim} />
            </>
          )}
          {[
            { valor: "todos", label: "Todos" },
            { valor: "sdr", label: "SDR" },
            { valor: "closer", label: "Closer" },
          ].map((o) => (
            <button
              key={o.valor}
              type="submit"
              name="quem"
              value={o.valor}
              className={`rounded-md border px-3.5 py-1.5 text-sm font-medium transition ${
                quem === o.valor ? "border-accent bg-surface-2 text-accent" : "border-border-strong text-muted hover:bg-surface-2"
              }`}
            >
              {o.label}
            </button>
          ))}
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{linhas.length} registro(s)</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-2">
                <th className="py-2 font-medium">Data</th>
                <th className="py-2 font-medium">Usuário</th>
                <th className="py-2 font-medium">Função</th>
                <th className="py-2 font-medium">Atividade</th>
                <th className="py-2 text-right font-medium">Quantidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {linhas.map((l, i) => (
                <tr key={i}>
                  <td className="py-2 font-num text-muted">{l.data}</td>
                  <td className="py-2 font-medium">{l.usuario}</td>
                  <td className="py-2">
                    <Badge tone={l.funcao === "SDR" ? "amber" : "teal"}>{l.funcao}</Badge>
                  </td>
                  <td className="py-2 text-muted">{l.atividade}</td>
                  <td className="py-2 text-right font-num font-semibold">{l.quantidade}</td>
                </tr>
              ))}
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-muted">
                    Nenhum lançamento nesse período.
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
