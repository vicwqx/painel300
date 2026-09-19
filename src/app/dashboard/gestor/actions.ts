"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { StatusLead } from "@prisma/client";

async function checarPermissao() {
  const session = await auth();
  const papel = (session?.user as { role?: string } | undefined)?.role;
  if (papel !== "ADMIN" && papel !== "GESTOR") throw new Error("Sem permissão.");
}

const campanhaSchema = z.object({
  nome: z.string().min(2),
  metaValor: z.coerce.number().int().positive(),
  inicio: z.string(),
  fim: z.string(),
});

export type CriarCampanhaState = { erro?: string; ok?: boolean };

export async function criarCampanhaAction(
  _prevState: CriarCampanhaState,
  formData: FormData
): Promise<CriarCampanhaState> {
  await checarPermissao();
  const parsed = campanhaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erro: "Dados inválidos. Confira os campos." };
  const { nome, metaValor, inicio, fim } = parsed.data;

  await prisma.campanha.create({
    data: {
      nome,
      metaMetrica: "cotacoes",
      metaValor,
      inicio: new Date(inicio),
      fim: new Date(fim),
    },
  });

  revalidatePath("/dashboard/gestor");
  return { ok: true };
}

export async function alternarParticipanteAction(campanhaId: string, profileId: string, participa: boolean) {
  await checarPermissao();
  if (participa) {
    await prisma.campanhaParticipante.upsert({
      where: { campanhaId_profileId: { campanhaId, profileId } },
      update: {},
      create: { campanhaId, profileId },
    });
  } else {
    await prisma.campanhaParticipante.delete({
      where: { campanhaId_profileId: { campanhaId, profileId } },
    }).catch(() => {});
  }
  revalidatePath("/dashboard/gestor");
}

export async function excluirLancamentoAction(lancamentoId: string) {
  await checarPermissao();
  await prisma.lancamentoDiario.delete({ where: { id: lancamentoId } });
  revalidatePath("/dashboard/admin/lancamentos");
  revalidatePath("/dashboard/gestor");
  revalidatePath("/dashboard");
}

const leadSchema = z.object({
  profileId: z.string(),
  nomeLead: z.string().min(2),
  telefone: z.string().optional(),
  placa: z.string().optional(),
  origemContato: z.string().optional(),
});

export type CriarLeadState = { erro?: string; ok?: boolean };

export async function criarLeadAction(
  _prevState: CriarLeadState,
  formData: FormData
): Promise<CriarLeadState> {
  await checarPermissao();
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erro: "Dados inválidos. Confira os campos." };

  await prisma.lead.create({ data: parsed.data });
  revalidatePath("/dashboard/gestor");
  return { ok: true };
}

export async function atualizarStatusLeadAction(leadId: string, statusAnterior: StatusLead, statusNovo: StatusLead) {
  await checarPermissao();
  await prisma.lead.update({ where: { id: leadId }, data: { status: statusNovo } });
  await prisma.leadStatusHistorico.create({
    data: { leadId, statusAnterior, statusNovo },
  });
  revalidatePath("/dashboard/gestor");
}
