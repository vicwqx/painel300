"use server";

import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria, exigirPapel } from "@/lib/crm/sessao";
import { registrarHistorico } from "@/lib/crm/historico";
import { notificarUsuarios } from "@/lib/crm/notificacoes";
import { criarUsuarioComPapelFixo, type CriarUsuarioSimplesState } from "@/lib/crm/criar-usuario";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function distribuirLeadAction(leadId: string, closerId: string) {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["GERENTE_CLOSER", "ADMIN"]);

  const closer = await prisma.profile.findUnique({ where: { id: closerId } });
  if (!closer) throw new Error("Closer não encontrado.");

  await prisma.$transaction(async (tx) => {
    const lead = await tx.crmLead.findUnique({ where: { id: leadId } });
    if (!lead) throw new Error("Lead não encontrado.");
    if (lead.status !== "AGUARDANDO_CLOSER") {
      throw new Error("Esse lead já foi distribuído.");
    }

    await tx.crmLead.update({
      where: { id: leadId },
      data: { closerId, status: "DISTRIBUIDO_CLOSER", distribuidoEm: new Date() },
    });

    await registrarHistorico(tx, {
      leadId,
      usuarioId: sessao.userId,
      acao: "Lead distribuído.",
      detalhe: `Para ${closer.nome}`,
    });

    await notificarUsuarios(tx, [closer.userId], `Novo lead qualificado recebido: ${lead.nome}.`);
  });

  revalidatePath("/dashboard/gerente-closer");
  revalidatePath("/dashboard/closer");
}

const criarUsuarioSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha precisa ter ao menos 6 caracteres"),
});

export async function criarCloserAction(
  _prevState: CriarUsuarioSimplesState,
  formData: FormData
): Promise<CriarUsuarioSimplesState> {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["GERENTE_CLOSER", "ADMIN"]);

  const parsed = criarUsuarioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const resultado = await criarUsuarioComPapelFixo({
    ...parsed.data,
    role: "CLOSER",
    criadoPorUserId: sessao.userId,
  });

  if (resultado.ok) revalidatePath("/dashboard/gerente-closer");
  return resultado;
}
