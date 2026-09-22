import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria } from "@/lib/crm/sessao";
import { LancamentoCloserForm } from "./lancamento-form";
import Link from "next/link";

function hojeISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export default async function LancamentoCloserPage() {
  const sessao = await sessaoCrmObrigatoria();
  const hoje = hojeISO();

  const existente = await prisma.closerLancamento.findUnique({
    where: { closerId_data: { closerId: sessao.profileId, data: new Date(hoje) } },
  });

  return (
    <div className="max-w-2xl space-y-4">
      <Link href="/dashboard/closer" className="text-xs text-muted hover:underline">
        ← Voltar
      </Link>
      <LancamentoCloserForm
        existente={
          existente
            ? {
                data: hoje,
                oportunidadesRecebidas: existente.oportunidadesRecebidas,
                oportunidadesTrabalhadas: existente.oportunidadesTrabalhadas,
                retornos: existente.retornos,
                contatosProdutivos: existente.contatosProdutivos,
                cotacoes: existente.cotacoes,
                vendas: existente.vendas,
                semProdutividade: existente.semProdutividade,
                observacoes: existente.observacoes,
              }
            : undefined
        }
      />
    </div>
  );
}
