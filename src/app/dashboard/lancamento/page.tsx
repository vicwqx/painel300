import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LancamentoForm } from "./form";

export default async function LancamentoPage() {
  const session = await auth();
  const profileId = (session?.user as { profileId?: string } | undefined)?.profileId;

  const hojeStr = new Date().toISOString().slice(0, 10);
  const lancamentoDeHoje = profileId
    ? await prisma.lancamentoDiario.findUnique({
        where: { profileId_data: { profileId, data: new Date(hojeStr) } },
      })
    : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Lançamento do dia</h1>
        <p className="text-sm text-muted">Preencha os números de hoje.</p>
      </div>
      <LancamentoForm dataInicial={hojeStr} valoresIniciais={lancamentoDeHoje} />
    </div>
  );
}
