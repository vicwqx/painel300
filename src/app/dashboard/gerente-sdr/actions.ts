"use server";

import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria, exigirPapel } from "@/lib/crm/sessao";
import { registrarHistorico } from "@/lib/crm/historico";
import { criarUsuarioComPapelFixo, type CriarUsuarioSimplesState } from "@/lib/crm/criar-usuario";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function redistribuirLeadAction(leadId: string, novoSdrId: string) {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["GERENTE_SDR", "ADMIN"]);

  const novoSdr = await prisma.profile.findUnique({ where: { id: novoSdrId } });
  if (!novoSdr) throw new Error("SDR não encontrado.");

  await prisma.$transaction(async (tx) => {
    const lead = await tx.crmLead.findUnique({ where: { id: leadId } });
    if (!lead) throw new Error("Lead não encontrado.");
    if (lead.status !== "EM_QUALIFICACAO") {
      throw new Error("Esse lead não está mais em qualificação.");
    }

    await tx.crmLead.update({ where: { id: leadId }, data: { sdrId: novoSdrId } });
    await registrarHistorico(tx, {
      leadId,
      usuarioId: sessao.userId,
      acao: "Lead redistribuído.",
      detalhe: `Reatribuído para ${novoSdr.nome}`,
    });
  });

  revalidatePath("/dashboard/gerente-sdr");
  revalidatePath("/dashboard/sdr");
}

const criarUsuarioSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha precisa ter ao menos 6 caracteres"),
});

export async function criarSdrAction(
  _prevState: CriarUsuarioSimplesState,
  formData: FormData
): Promise<CriarUsuarioSimplesState> {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["GERENTE_SDR", "ADMIN"]);

  const parsed = criarUsuarioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const resultado = await criarUsuarioComPapelFixo({
    ...parsed.data,
    role: "SDR",
    criadoPorUserId: sessao.userId,
  });

  if (resultado.ok) revalidatePath("/dashboard/gerente-sdr");
  return resultado;
}
