"use server";

import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria, exigirPapel } from "@/lib/crm/sessao";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  data: z.string().min(1, "Informe a data"),
  nome: z.string().min(2, "Nome muito curto"),
  telefone: z.string().optional(),
  cep: z.string().optional(),
  cidade: z.string().optional(),
  placa: z.string().optional(),
  modelo: z.string().optional(),
  ano: z.string().optional(),
  origem: z.string().optional(),
  tipoAtividade: z.enum(["OPORTUNIDADE", "QUALIFICACAO"]),
  tipoUso: z.enum(["PARTICULAR", "APLICATIVO"]).optional(),
  temSeguro: z.string().optional(),
  seguroAtual: z.string().optional(),
  motivo: z.string().optional(),
  observacao: z.string().optional(),
  temperatura: z.enum(["FRIO", "MORNO", "QUENTE"]).optional(),
});

export type LancamentoSdrState = { erro?: string; ok?: boolean };

export async function criarLancamentoSdrAction(
  _prevState: LancamentoSdrState,
  formData: FormData
): Promise<LancamentoSdrState> {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["SDR", "ADMIN"]);

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const dados = parsed.data;

  await prisma.sdrLancamento.create({
    data: {
      sdrId: sessao.profileId,
      data: new Date(dados.data),
      nome: dados.nome,
      telefone: dados.telefone || null,
      cep: dados.cep || null,
      cidade: dados.cidade || null,
      placa: dados.placa || null,
      modelo: dados.modelo || null,
      ano: dados.ano || null,
      origem: dados.origem || null,
      tipoAtividade: dados.tipoAtividade,
      tipoUso: dados.tipoUso || null,
      temSeguro: dados.temSeguro ? dados.temSeguro === "sim" : null,
      seguroAtual: dados.seguroAtual || null,
      motivo: dados.motivo || null,
      observacao: dados.observacao || null,
      temperatura: dados.temperatura || null,
    },
  });

  revalidatePath("/dashboard/sdr");
  revalidatePath("/dashboard/sdr/lancamentos");
  return { ok: true };
}

export async function editarLancamentoSdrAction(
  id: string,
  _prevState: LancamentoSdrState,
  formData: FormData
): Promise<LancamentoSdrState> {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["SDR", "ADMIN"]);

  const existente = await prisma.sdrLancamento.findUnique({ where: { id } });
  if (!existente) return { erro: "Lançamento não encontrado." };
  if (existente.sdrId !== sessao.profileId && sessao.role !== "ADMIN") {
    return { erro: "Esse lançamento não é seu." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const dados = parsed.data;

  await prisma.sdrLancamento.update({
    where: { id },
    data: {
      data: new Date(dados.data),
      nome: dados.nome,
      telefone: dados.telefone || null,
      cep: dados.cep || null,
      cidade: dados.cidade || null,
      placa: dados.placa || null,
      modelo: dados.modelo || null,
      ano: dados.ano || null,
      origem: dados.origem || null,
      tipoAtividade: dados.tipoAtividade,
      tipoUso: dados.tipoUso || null,
      temSeguro: dados.temSeguro ? dados.temSeguro === "sim" : null,
      seguroAtual: dados.seguroAtual || null,
      motivo: dados.motivo || null,
      observacao: dados.observacao || null,
      temperatura: dados.temperatura || null,
    },
  });

  revalidatePath("/dashboard/sdr");
  revalidatePath("/dashboard/sdr/lancamentos");
  return { ok: true };
}

export async function registrarLigacoesAction(data: string, ligacoes: number) {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["SDR", "ADMIN"]);

  await prisma.sdrProducaoDiaria.upsert({
    where: { sdrId_data: { sdrId: sessao.profileId, data: new Date(data) } },
    update: { ligacoes },
    create: { sdrId: sessao.profileId, data: new Date(data), ligacoes },
  });

  revalidatePath("/dashboard/sdr");
}
