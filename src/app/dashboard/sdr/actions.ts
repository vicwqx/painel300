"use server";

import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria, exigirPapel } from "@/lib/crm/sessao";
import { registrarHistorico } from "@/lib/crm/historico";
import { idsDosUsuariosComPapel, notificarUsuarios } from "@/lib/crm/notificacoes";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CrmLeadStatus } from "@prisma/client";

export async function assumirLeadAction(leadId: string) {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["SDR", "ADMIN"]);

  await prisma.$transaction(async (tx) => {
    const lead = await tx.crmLead.findUnique({ where: { id: leadId } });
    if (!lead) throw new Error("Lead não encontrado.");
    if (lead.status !== "AGUARDANDO_SDR" || lead.sdrId) {
      throw new Error("Esse lead já foi assumido por outro SDR.");
    }

    await tx.crmLead.update({
      where: { id: leadId },
      data: { sdrId: sessao.profileId, status: "EM_QUALIFICACAO" },
    });
    await registrarHistorico(tx, {
      leadId,
      usuarioId: sessao.userId,
      acao: "Assumiu o lead.",
    });
  });

  revalidatePath("/dashboard/sdr");
}

const qualificacaoSchema = z.object({
  clienteRespondeu: z.coerce.boolean().optional().default(false),
  interesse: z.string().optional(),
  modeloVeiculo: z.string().optional(),
  anoVeiculo: z.string().optional(),
  cep: z.string().optional(),
  cidade: z.string().optional(),
  possuiSeguro: z.string().optional(),
  seguradoraAtual: z.string().optional(),
  motivoTroca: z.string().optional(),
  melhorHorario: z.string().optional(),
  observacoes: z.string().optional(),
  temperatura: z.enum(["FRIO", "MORNO", "QUENTE"]),
});

export type QualificarLeadState = { erro?: string; ok?: boolean };

export async function qualificarLeadAction(
  leadId: string,
  _prevState: QualificarLeadState,
  formData: FormData
): Promise<QualificarLeadState> {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["SDR", "ADMIN"]);

  const raw = Object.fromEntries(formData);
  const parsed = qualificacaoSchema.safeParse(raw);
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const dados = parsed.data;

  const lead = await prisma.crmLead.findUnique({ where: { id: leadId } });
  if (!lead) return { erro: "Lead não encontrado." };
  if (lead.sdrId !== sessao.profileId && sessao.role !== "ADMIN") {
    return { erro: "Esse lead não está atribuído a você." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.qualification.upsert({
      where: { leadId },
      create: {
        leadId,
        sdrId: sessao.profileId,
        clienteRespondeu: dados.clienteRespondeu ?? false,
        interesse: dados.interesse || null,
        modeloVeiculo: dados.modeloVeiculo || null,
        anoVeiculo: dados.anoVeiculo || null,
        cep: dados.cep || null,
        cidade: dados.cidade || null,
        possuiSeguro: dados.possuiSeguro ? dados.possuiSeguro === "sim" : null,
        seguradoraAtual: dados.seguradoraAtual || null,
        motivoTroca: dados.motivoTroca || null,
        melhorHorario: dados.melhorHorario || null,
        observacoes: dados.observacoes || null,
        temperatura: dados.temperatura,
      },
      update: {
        clienteRespondeu: dados.clienteRespondeu ?? false,
        interesse: dados.interesse || null,
        modeloVeiculo: dados.modeloVeiculo || null,
        anoVeiculo: dados.anoVeiculo || null,
        cep: dados.cep || null,
        cidade: dados.cidade || null,
        possuiSeguro: dados.possuiSeguro ? dados.possuiSeguro === "sim" : null,
        seguradoraAtual: dados.seguradoraAtual || null,
        motivoTroca: dados.motivoTroca || null,
        melhorHorario: dados.melhorHorario || null,
        observacoes: dados.observacoes || null,
        temperatura: dados.temperatura,
      },
    });

    const agora = new Date();
    await tx.crmLead.update({
      where: { id: leadId },
      data: {
        status: "AGUARDANDO_CLOSER",
        temperatura: dados.temperatura,
        qualificadoEm: agora,
        enviadoParaCloserEm: agora,
      },
    });

    await registrarHistorico(tx, { leadId, usuarioId: sessao.userId, acao: "Lead qualificado." });
    await registrarHistorico(tx, {
      leadId,
      usuarioId: sessao.userId,
      acao: "Enviou para o closer.",
      detalhe: `Temperatura: ${dados.temperatura}`,
    });

    const gerentesIds = await idsDosUsuariosComPapel(tx, "GERENTE_CLOSER");
    await notificarUsuarios(tx, gerentesIds, `Lead qualificado aguardando distribuição: ${lead.nome}.`);
  });

  revalidatePath("/dashboard/sdr");
  revalidatePath(`/dashboard/crm/leads/${leadId}`);
  return { ok: true };
}

export async function descartarLeadAction(leadId: string, motivo: CrmLeadStatus) {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["SDR", "ADMIN"]);

  const lead = await prisma.crmLead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead não encontrado.");
  if (lead.sdrId !== sessao.profileId && sessao.role !== "ADMIN") {
    throw new Error("Esse lead não está atribuído a você.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.crmLead.update({
      where: { id: leadId },
      data: { status: motivo, fechadoEm: new Date() },
    });
    await registrarHistorico(tx, {
      leadId,
      usuarioId: sessao.userId,
      acao: "Lead descartado.",
      detalhe: motivo,
    });
  });

  revalidatePath("/dashboard/sdr");
  revalidatePath(`/dashboard/crm/leads/${leadId}`);
}

const criarEQualificarSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  telefone: z.string().min(8, "Telefone inválido"),
  placa: z.string().optional(),
  modeloVeiculo: z.string().optional(),
  anoVeiculo: z.string().optional(),
  cidade: z.string().optional(),
  cep: z.string().optional(),
  origem: z.string().optional(),
  interesse: z.string().optional(),
  possuiSeguro: z.string().optional(),
  seguradoraAtual: z.string().optional(),
  motivoTroca: z.string().optional(),
  melhorHorario: z.string().optional(),
  observacoes: z.string().optional(),
  temperatura: z.enum(["FRIO", "MORNO", "QUENTE"]),
});

export type CriarEQualificarLeadState = { erro?: string; ok?: boolean };

/**
 * Autonomia do SDR: cria o lead e já qualifica na mesma etapa, pulando a fila
 * de prospecção — usado quando o próprio SDR conseguiu o contato direto.
 */
export async function criarEQualificarLeadAction(
  _prevState: CriarEQualificarLeadState,
  formData: FormData
): Promise<CriarEQualificarLeadState> {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["SDR", "ADMIN"]);

  const parsed = criarEQualificarSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const dados = parsed.data;

  await prisma.$transaction(async (tx) => {
    const agora = new Date();
    const lead = await tx.crmLead.create({
      data: {
        nome: dados.nome,
        telefone: dados.telefone,
        placa: dados.placa || null,
        modeloVeiculo: dados.modeloVeiculo || null,
        anoVeiculo: dados.anoVeiculo || null,
        cidade: dados.cidade || null,
        origem: dados.origem || "SDR (contato direto)",
        observacaoInicial: dados.observacoes || null,
        prospectorId: sessao.profileId,
        sdrId: sessao.profileId,
        status: "AGUARDANDO_CLOSER",
        temperatura: dados.temperatura,
        qualificadoEm: agora,
        enviadoParaCloserEm: agora,
      },
    });

    await tx.qualification.create({
      data: {
        leadId: lead.id,
        sdrId: sessao.profileId,
        clienteRespondeu: true,
        interesse: dados.interesse || null,
        modeloVeiculo: dados.modeloVeiculo || null,
        anoVeiculo: dados.anoVeiculo || null,
        cep: dados.cep || null,
        cidade: dados.cidade || null,
        possuiSeguro: dados.possuiSeguro ? dados.possuiSeguro === "sim" : null,
        seguradoraAtual: dados.seguradoraAtual || null,
        motivoTroca: dados.motivoTroca || null,
        melhorHorario: dados.melhorHorario || null,
        observacoes: dados.observacoes || null,
        temperatura: dados.temperatura,
      },
    });

    await registrarHistorico(tx, {
      leadId: lead.id,
      usuarioId: sessao.userId,
      acao: "Criou o lead diretamente (contato próprio do SDR).",
    });
    await registrarHistorico(tx, {
      leadId: lead.id,
      usuarioId: sessao.userId,
      acao: "Qualificou e enviou direto para o closer.",
      detalhe: `Temperatura: ${dados.temperatura}`,
    });

    const gerentesIds = await idsDosUsuariosComPapel(tx, "GERENTE_CLOSER");
    await notificarUsuarios(tx, gerentesIds, `Lead qualificado aguardando distribuição: ${lead.nome}.`);
  });

  revalidatePath("/dashboard/sdr");
  return { ok: true };
}
