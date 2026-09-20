"use server";

import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria } from "@/lib/crm/sessao";
import { revalidatePath } from "next/cache";

export async function marcarTodasLidasAction() {
  const sessao = await sessaoCrmObrigatoria();
  await prisma.notification.updateMany({
    where: { userId: sessao.userId, lida: false },
    data: { lida: true },
  });
  revalidatePath("/dashboard/notificacoes");
}

export async function marcarLidaAction(id: string) {
  const sessao = await sessaoCrmObrigatoria();
  await prisma.notification.updateMany({
    where: { id, userId: sessao.userId },
    data: { lida: true },
  });
  revalidatePath("/dashboard/notificacoes");
}
