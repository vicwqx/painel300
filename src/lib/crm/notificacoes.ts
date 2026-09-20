import { prisma } from "@/lib/prisma";
import type { Prisma, Role } from "@prisma/client";

/** Cria uma notificação pra cada usuário da lista. Não faz nada se a lista vier vazia. */
export async function notificarUsuarios(
  tx: Prisma.TransactionClient | typeof prisma,
  userIds: string[],
  mensagem: string
) {
  if (userIds.length === 0) return;
  await tx.notification.createMany({
    data: userIds.map((userId) => ({ userId, mensagem })),
  });
}

/** Busca os IDs de usuário (não de perfil) de todo mundo com um determinado papel. */
export async function idsDosUsuariosComPapel(
  tx: Prisma.TransactionClient | typeof prisma,
  papel: Role
): Promise<string[]> {
  const usuarios = await tx.user.findMany({ where: { role: papel }, select: { id: true } });
  return usuarios.map((u) => u.id);
}
