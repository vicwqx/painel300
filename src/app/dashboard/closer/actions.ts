"use server";

import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria, exigirPapel } from "@/lib/crm/sessao";
import { registrarHistorico } from "@/lib/crm/historico";
import { revalidatePath } from "next/cache";
import type { CrmLeadStatus } from "@prisma/client";

async function checarLeadDoCloser(leadId: string, profileId: string, isAdmin: boolean) {
  const lead = await prisma.crmLead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead não encontrado.");
  if (lead.closerId !== profileId && !isAdmin) {
    throw new Error("Esse lead não está atribuído a você.");
  }
  return lead;
}

const STATUS_LABEL_HISTORICO: Partial<Record<CrmLeadStatus, string>> = {
  EM_CONTATO: "Registrou primeiro contato.",
  NEGOCIACAO: "Moveu para negociação.",
  RETORNO_AGENDADO: "Agendou retorno.",
};

export async function atualizarStatusCloserAction(
  leadId: string,
  novoStatus: "EM_CONTATO" | "NEGOCIACAO" | "RETORNO_AGENDADO",
  detalhe?: string
) {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["CLOSER", "ADMIN"]);
  await checarLeadDoCloser(leadId, sessao.profileId, sessao.role === "ADMIN");

  await prisma.$transaction(async (tx) => {
    await tx.crmLead.update({ where: { id: leadId }, data: { status: novoStatus } });
    await registrarHistorico(tx, {
      leadId,
      usuarioId: sessao.userId,
      acao: STATUS_LABEL_HISTORICO[novoStatus] ?? "Atualizou o status.",
      detalhe,
    });
  });

  revalidatePath("/dashboard/closer");
  revalidatePath(`/dashboard/crm/leads/${leadId}`);
}

export async function registrarCotacaoAction(leadId: string, valor: string, observacoes: string) {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["CLOSER", "ADMIN"]);
  await checarLeadDoCloser(leadId, sessao.profileId, sessao.role === "ADMIN");

  const valorNum = valor.trim() ? Number(valor.replace(",", ".")) : null;

  await prisma.$transaction(async (tx) => {
    await tx.quote.create({
      data: {
        leadId,
        closerId: sessao.profileId,
        valor: valorNum,
        observacoes: observacoes || null,
      },
    });
    await tx.crmLead.update({ where: { id: leadId }, data: { status: "COTACAO" } });
    await registrarHistorico(tx, {
      leadId,
      usuarioId: sessao.userId,
      acao: "Cotação enviada.",
      detalhe: valorNum ? `Valor: R$ ${valorNum.toLocaleString("pt-BR")}` : observacoes || undefined,
    });
  });

  revalidatePath("/dashboard/closer");
  revalidatePath(`/dashboard/crm/leads/${leadId}`);
}

export async function registrarVendaAction(leadId: string, valor: string) {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["CLOSER", "ADMIN"]);
  await checarLeadDoCloser(leadId, sessao.profileId, sessao.role === "ADMIN");

  const valorNum = valor.trim() ? Number(valor.replace(",", ".")) : null;

  await prisma.$transaction(async (tx) => {
    await tx.sale.create({
      data: { leadId, closerId: sessao.profileId, valor: valorNum },
    });
    await tx.crmLead.update({
      where: { id: leadId },
      data: { status: "VENDA", fechadoEm: new Date() },
    });
    await registrarHistorico(tx, {
      leadId,
      usuarioId: sessao.userId,
      acao: "Venda realizada.",
      detalhe: valorNum ? `Valor: R$ ${valorNum.toLocaleString("pt-BR")}` : undefined,
    });
  });

  revalidatePath("/dashboard/closer");
  revalidatePath(`/dashboard/crm/leads/${leadId}`);
}

export async function registrarPerdidoAction(leadId: string, motivo: string) {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["CLOSER", "ADMIN"]);
  await checarLeadDoCloser(leadId, sessao.profileId, sessao.role === "ADMIN");

  await prisma.$transaction(async (tx) => {
    await tx.crmLead.update({
      where: { id: leadId },
      data: { status: "PERDIDO", fechadoEm: new Date() },
    });
    await registrarHistorico(tx, {
      leadId,
      usuarioId: sessao.userId,
      acao: "Lead perdido.",
      detalhe: motivo || undefined,
    });
  });

  revalidatePath("/dashboard/closer");
  revalidatePath(`/dashboard/crm/leads/${leadId}`);
}
