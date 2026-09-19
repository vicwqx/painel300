import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SessaoCrm = {
  userId: string;
  profileId: string;
  nome: string;
  role: string;
};

/**
 * Busca a sessão atual já resolvida com o profileId — toda action do CRM
 * depende disso pra saber "quem" está fazendo a ação (pra histórico e permissão).
 * Lança erro se não houver sessão ou perfil vinculado; quem chama decide o que
 * fazer com isso (as actions do App Router simplesmente propagam o erro).
 */
export async function sessaoCrmObrigatoria(): Promise<SessaoCrm> {
  const session = await auth();
  const user = session?.user as { role?: string; profileId?: string; name?: string | null } | undefined;
  if (!user?.profileId) throw new Error("Sessão inválida ou perfil não vinculado.");
  const profile = await prisma.profile.findUnique({ where: { id: user.profileId } });
  if (!profile) throw new Error("Perfil não encontrado.");
  return {
    userId: profile.userId,
    profileId: profile.id,
    nome: profile.nome,
    role: user.role ?? "EXECUTIVO",
  };
}

export function exigirPapel(sessao: SessaoCrm, papeisPermitidos: string[]) {
  if (!papeisPermitidos.includes(sessao.role)) {
    throw new Error("Sem permissão para executar essa ação.");
  }
}
