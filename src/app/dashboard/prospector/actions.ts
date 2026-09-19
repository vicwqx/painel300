"use server";

import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria, exigirPapel } from "@/lib/crm/sessao";
import { registrarHistorico } from "@/lib/crm/historico";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  telefone: z.string().min(8, "Telefone inválido"),
  placa: z.string().optional(),
  modeloVeiculo: z.string().optional(),
  anoVeiculo: z.string().optional(),
  cidade: z.string().optional(),
  observacaoInicial: z.string().optional(),
  origem: z.string().optional(),
});

export type CriarLeadCrmState = { erro?: string; ok?: boolean };

export async function criarLeadCrmAction(
  _prevState: CriarLeadCrmState,
  formData: FormData
): Promise<CriarLeadCrmState> {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["PROSPECTOR", "ADMIN"]);

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const dados = parsed.data;

  await prisma.$transaction(async (tx) => {
    const lead = await tx.crmLead.create({
      data: {
        nome: dados.nome,
        telefone: dados.telefone,
        placa: dados.placa || null,
        modeloVeiculo: dados.modeloVeiculo || null,
        anoVeiculo: dados.anoVeiculo || null,
        cidade: dados.cidade || null,
        observacaoInicial: dados.observacaoInicial || null,
        origem: dados.origem || null,
        prospectorId: sessao.profileId,
        status: "AGUARDANDO_SDR",
      },
    });

    await registrarHistorico(tx, {
      leadId: lead.id,
      usuarioId: sessao.userId,
      acao: "Criou o lead.",
    });
    await registrarHistorico(tx, {
      leadId: lead.id,
      usuarioId: null,
      acao: "Lead enviado para a fila do SDR.",
    });
  });

  revalidatePath("/dashboard/prospector");
  return { ok: true };
}
