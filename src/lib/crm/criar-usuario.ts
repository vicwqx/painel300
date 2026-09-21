import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

export type CriarUsuarioSimplesState = { erro?: string; ok?: boolean };

/**
 * Cria um usuário com papel fixo (usado pelos gerentes, que só podem criar
 * gente da própria equipe) e registra em auditoria. O admin continua usando
 * o fluxo completo em /dashboard/admin, que permite escolher qualquer papel.
 */
export async function criarUsuarioComPapelFixo(params: {
  nome: string;
  email: string;
  senha: string;
  role: Role;
  criadoPorUserId: string | null;
}): Promise<CriarUsuarioSimplesState> {
  const email = params.email.toLowerCase().trim();

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) return { erro: "Já existe um usuário com esse e-mail." };

  const passwordHash = await bcrypt.hash(params.senha, 10);
  const novo = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: params.role,
      profile: { create: { nome: params.nome } },
    },
  });

  await prisma.auditLog.create({
    data: {
      usuarioId: params.criadoPorUserId,
      tabela: "users",
      registroId: novo.id,
      acao: "Criação de usuário",
      dadosDepois: { email, role: params.role, nome: params.nome },
    },
  });

  return { ok: true };
}
