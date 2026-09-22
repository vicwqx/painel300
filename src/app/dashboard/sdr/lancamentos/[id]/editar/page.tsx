import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria } from "@/lib/crm/sessao";
import { notFound, redirect } from "next/navigation";
import { LancamentoSdrForm } from "../../../lancamento/lancamento-form";
import Link from "next/link";

function dataISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function EditarLancamentoSdrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await sessaoCrmObrigatoria();

  const lancamento = await prisma.sdrLancamento.findUnique({ where: { id } });
  if (!lancamento) notFound();

  const podeEditar = sessao.role === "ADMIN" || lancamento.sdrId === sessao.profileId;
  if (!podeEditar) redirect("/dashboard/sdr/lancamentos");

  return (
    <div className="max-w-2xl space-y-4">
      <Link href="/dashboard/sdr/lancamentos" className="text-xs text-muted hover:underline">
        ← Voltar
      </Link>
      <LancamentoSdrForm
        existente={{
          id: lancamento.id,
          data: dataISO(lancamento.data),
          nome: lancamento.nome,
          telefone: lancamento.telefone,
          cep: lancamento.cep,
          cidade: lancamento.cidade,
          placa: lancamento.placa,
          modelo: lancamento.modelo,
          ano: lancamento.ano,
          origem: lancamento.origem,
          tipoAtividade: lancamento.tipoAtividade,
          tipoUso: lancamento.tipoUso,
          temSeguro: lancamento.temSeguro,
          seguroAtual: lancamento.seguroAtual,
          motivo: lancamento.motivo,
          observacao: lancamento.observacao,
          temperatura: lancamento.temperatura,
        }}
      />
    </div>
  );
}
