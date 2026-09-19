import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Registra uma linha na timeline do lead. Aceita um client de transação opcional
 * pra poder ser chamado dentro de um prisma.$transaction junto com a mudança
 * de status, garantindo que o histórico nunca fica dessincronizado do lead.
 */
export async function registrarHistorico(
  tx: Prisma.TransactionClient | typeof prisma,
  params: { leadId: string; usuarioId: string | null; acao: string; detalhe?: string }
) {
  await tx.crmLeadHistorico.create({
    data: {
      leadId: params.leadId,
      usuarioId: params.usuarioId,
      acao: params.acao,
      detalhe: params.detalhe,
    },
  });
}
