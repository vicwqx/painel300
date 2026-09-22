"use server";

import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria, exigirPapel } from "@/lib/crm/sessao";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  data: z.string().min(1, "Informe a data"),
  oportunidadesRecebidas: z.coerce.number().int().min(0).default(0),
  oportunidadesTrabalhadas: z.coerce.number().int().min(0).default(0),
  retornos: z.coerce.number().int().min(0).default(0),
  contatosProdutivos: z.coerce.number().int().min(0).default(0),
  cotacoes: z.coerce.number().int().min(0).default(0),
  vendas: z.coerce.number().int().min(0).default(0),
  semProdutividade: z.coerce.number().int().min(0).default(0),
  observacoes: z.string().optional(),
});

export type LancamentoCloserState = { erro?: string; ok?: boolean };

export async function salvarLancamentoCloserAction(
  _prevState: LancamentoCloserState,
  formData: FormData
): Promise<LancamentoCloserState> {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["CLOSER", "ADMIN"]);

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const { data, ...metricas } = parsed.data;

  await prisma.closerLancamento.upsert({
    where: { closerId_data: { closerId: sessao.profileId, data: new Date(data) } },
    update: metricas,
    create: { closerId: sessao.profileId, data: new Date(data), ...metricas },
  });

  revalidatePath("/dashboard/closer");
  revalidatePath("/dashboard/closer/lancamentos");
  return { ok: true };
}
