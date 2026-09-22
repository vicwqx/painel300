"use server";

import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria, exigirPapel } from "@/lib/crm/sessao";
import { criarUsuarioComPapelFixo, type CriarUsuarioSimplesState } from "@/lib/crm/criar-usuario";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const criarSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha precisa ter ao menos 6 caracteres"),
  papel: z.enum(["SDR", "CLOSER"]),
});

export async function criarMembroEquipeAction(
  _prevState: CriarUsuarioSimplesState,
  formData: FormData
): Promise<CriarUsuarioSimplesState> {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["GERENTE", "ADMIN"]);

  const parsed = criarSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const { papel, ...dados } = parsed.data;

  const resultado = await criarUsuarioComPapelFixo({ ...dados, role: papel, criadoPorUserId: sessao.userId });
  if (resultado.ok) revalidatePath("/dashboard/gerente/equipe");
  return resultado;
}

export async function alternarAtivoEquipeAction(profileId: string, ativo: boolean) {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["GERENTE", "ADMIN"]);

  await prisma.profile.update({ where: { id: profileId }, data: { ativo } });
  await prisma.auditLog.create({
    data: {
      usuarioId: sessao.userId,
      tabela: "profiles",
      registroId: profileId,
      acao: ativo ? "Reativação de perfil" : "Desativação de perfil",
    },
  });

  revalidatePath("/dashboard/gerente/equipe");
}
