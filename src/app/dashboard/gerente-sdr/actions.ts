"use server";

import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria, exigirPapel } from "@/lib/crm/sessao";
import { registrarHistorico } from "@/lib/crm/historico";
import { revalidatePath } from "next/cache";

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
