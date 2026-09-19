"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Cargo, Role } from "@prisma/client";

const schema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha precisa ter ao menos 6 caracteres"),
  cargo: z.nativeEnum(Cargo),
  role: z.nativeEnum(Role),
});

export type CriarUsuarioState = { erro?: string; ok?: boolean };

export async function criarUsuarioAction(
  _prevState: CriarUsuarioState,
  formData: FormData
): Promise<CriarUsuarioState> {
  const session = await auth();
  const papel = (session?.user as { role?: string } | undefined)?.role;
  if (papel !== "ADMIN") return { erro: "Sem permissão." };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { nome, email, senha, cargo, role } = parsed.data;

  const existente = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existente) return { erro: "Já existe um usuário com esse e-mail." };

  const passwordHash = await bcrypt.hash(senha, 10);
  await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      profile: { create: { nome, cargo } },
    },
  });

  revalidatePath("/dashboard/admin");
  return { ok: true };
}

export type AtualizarStatusState = { erro?: string; ok?: boolean };

export async function alternarAtivoAction(profileId: string, ativo: boolean) {
  const session = await auth();
  const papel = (session?.user as { role?: string } | undefined)?.role;
  if (papel !== "ADMIN") throw new Error("Sem permissão.");

  await prisma.profile.update({ where: { id: profileId }, data: { ativo } });
  revalidatePath("/dashboard/admin");
}
