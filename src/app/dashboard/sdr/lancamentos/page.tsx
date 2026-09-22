import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria } from "@/lib/crm/sessao";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TIPO_ATIVIDADE_LABEL, TIPO_ATIVIDADE_TONE, TEMPERATURA_LABEL, TEMPERATURA_TONE } from "@/lib/crm/labels";
import Link from "next/link";
import type { Prisma, TipoAtividadeSdr, Temperatura } from "@prisma/client";

function dataISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function MeusLancamentosSdrPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; inicio?: string; fim?: string; tipo?: string; temperatura?: string }>;
}) {
  const sessao = await sessaoCrmObrigatoria();
  const params = await searchParams;

  const where: Prisma.SdrLancamentoWhereInput = { sdrId: sessao.profileId };
  if (params.q) {
    where.OR = [
      { nome: { contains: params.q, mode: "insensitive" } },
      { telefone: { contains: params.q, mode: "insensitive" } },
      { placa: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.inicio || params.fim) {
    where.data = {
      ...(params.inicio ? { gte: new Date(params.inicio) } : {}),
      ...(params.fim ? { lte: new Date(params.fim) } : {}),
    };
  }
  if (params.tipo) where.tipoAtividade = params.tipo as TipoAtividadeSdr;
  if (params.temperatura) where.temperatura = params.temperatura as Temperatura;

  const lancamentos = await prisma.sdrLancamento.findMany({
    where,
    orderBy: { data: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Meus lançamentos</h1>
        <p className="text-sm text-muted">{lancamentos.length} registro(s) encontrado(s).</p>
      </div>

      <Card>
        <form className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <Input name="q" defaultValue={params.q} placeholder="Nome, telefone ou placa..." className="sm:col-span-2" />
          <Input name="inicio" type="date" defaultValue={params.inicio} />
          <Input name="fim" type="date" defaultValue={params.fim} />
          <select
            name="tipo"
            defaultValue={params.tipo ?? ""}
            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">Todos os tipos</option>
            <option value="OPORTUNIDADE">Oportunidade</option>
            <option value="QUALIFICACAO">Qualificação</option>
          </select>
          <div className="sm:col-span-5 flex flex-wrap items-center gap-2">
            <select
              name="temperatura"
              defaultValue={params.temperatura ?? ""}
              className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="">Todas as temperaturas</option>
              <option value="FRIO">Frio</option>
              <option value="MORNO">Morno</option>
              <option value="QUENTE">Quente</option>
            </select>
            <Button type="submit" className="px-4">
              Filtrar
            </Button>
            <Link href="/dashboard/sdr/lancamentos" className="text-xs text-muted hover:underline">
              Limpar filtros
            </Link>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registros</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="py-2 pr-3 font-medium">Data</th>
                <th className="py-2 pr-3 font-medium">Nome</th>
                <th className="py-2 pr-3 font-medium">Telefone</th>
                <th className="py-2 pr-3 font-medium">Cidade/CEP</th>
                <th className="py-2 pr-3 font-medium">Placa/Modelo/Ano</th>
                <th className="py-2 pr-3 font-medium">Origem</th>
                <th className="py-2 pr-3 font-medium">Tipo</th>
                <th className="py-2 pr-3 font-medium">Temp.</th>
                <th className="py-2 pr-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lancamentos.map((l) => (
                <tr key={l.id}>
                  <td className="py-2 pr-3 font-num text-muted">{dataISO(l.data)}</td>
                  <td className="py-2 pr-3 font-medium">{l.nome}</td>
                  <td className="py-2 pr-3 font-num text-muted">{l.telefone || "—"}</td>
                  <td className="py-2 pr-3 text-muted">{l.cidade || l.cep || "—"}</td>
                  <td className="py-2 pr-3 text-muted">
                    {[l.placa, l.modelo, l.ano].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td className="py-2 pr-3 text-muted">{l.origem || "—"}</td>
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
                  <td className="py-2 pr-3">
                    <Link
                      href={`/dashboard/sdr/lancamentos/${l.id}/editar`}
                      className="text-[11px] text-accent hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
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
