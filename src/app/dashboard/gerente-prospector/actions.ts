"use server";

import { sessaoCrmObrigatoria, exigirPapel } from "@/lib/crm/sessao";
import { criarUsuarioComPapelFixo, type CriarUsuarioSimplesState } from "@/lib/crm/criar-usuario";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha precisa ter ao menos 6 caracteres"),
});

export async function criarProspectorAction(
  _prevState: CriarUsuarioSimplesState,
  formData: FormData
): Promise<CriarUsuarioSimplesState> {
  const sessao = await sessaoCrmObrigatoria();
  exigirPapel(sessao, ["GERENTE_PROSPECTOR", "ADMIN"]);

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const resultado = await criarUsuarioComPapelFixo({
    ...parsed.data,
    role: "PROSPECTOR",
    criadoPorUserId: sessao.userId,
  });

  if (resultado.ok) revalidatePath("/dashboard/gerente-prospector");
  return resultado;
}
