"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  data: z.string(),
  prospeccoes: z.coerce.number().int().min(0),
  indicacoes: z.coerce.number().int().min(0),
  ligacoes: z.coerce.number().int().min(0),
  atendidas: z.coerce.number().int().min(0),
  cotacoes: z.coerce.number().int().min(0),
  followup: z.coerce.number().int().min(0),
  vendas: z.coerce.number().int().min(0),
  ativas: z.coerce.number().int().min(0),
});

export type SalvarLancamentoState = { erro?: string; ok?: boolean };

export async function salvarLancamentoAction(
  _prevState: SalvarLancamentoState,
  formData: FormData
): Promise<SalvarLancamentoState> {
  const session = await auth();
  const profileId = (session?.user as { profileId?: string } | undefined)?.profileId;
  if (!profileId) return { erro: "Perfil não encontrado para este usuário." };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erro: "Dados inválidos. Confira os campos." };

  const { data, ...metrics } = parsed.data;

  await prisma.lancamentoDiario.upsert({
    where: { profileId_data: { profileId, data: new Date(data) } },
    update: metrics,
    create: { profileId, data: new Date(data), ...metrics },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/lancamento");
  return { ok: true };
}
