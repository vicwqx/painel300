import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria } from "@/lib/crm/sessao";
import { rotaPadraoDoPapel } from "@/lib/rotas";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/crm/labels";
import Link from "next/link";

const PAPEIS_COM_BUSCA = ["ADMIN", "GERENTE_PROSPECTOR", "GERENTE_SDR", "GERENTE_CLOSER"];

export default async function BuscaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sessao = await sessaoCrmObrigatoria();
  if (!PAPEIS_COM_BUSCA.includes(sessao.role)) redirect(rotaPadraoDoPapel(sessao.role));

  const { q } = await searchParams;
  const termo = q?.trim() ?? "";

  const resultados = termo
    ? await prisma.crmLead.findMany({
        where: {
          OR: [
            { nome: { contains: termo, mode: "insensitive" } },
            { telefone: { contains: termo, mode: "insensitive" } },
            { placa: { contains: termo, mode: "insensitive" } },
          ],
        },
        include: {
          prospector: { select: { nome: true } },
          sdr: { select: { nome: true } },
          closer: { select: { nome: true } },
        },
        orderBy: { criadoEm: "desc" },
        take: 30,
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Busca de leads</h1>
        <p className="text-sm text-muted">Por nome, telefone ou placa — em toda a base do CRM.</p>
      </div>

      <Card>
        <form className="flex gap-2">
          <Input name="q" defaultValue={termo} placeholder="Nome, telefone ou placa..." className="max-w-md" />
          <Button type="submit" className="px-4">
            Buscar
          </Button>
        </form>
      </Card>

      {termo && (
        <Card>
          <CardHeader>
            <CardTitle>
              {resultados.length} resultado{resultados.length === 1 ? "" : "s"} para &ldquo;{termo}&rdquo;
            </CardTitle>
          </CardHeader>
          {resultados.length === 0 ? (
            <p className="text-sm text-muted">Nada encontrado.</p>
          ) : (
            <div className="divide-y divide-border">
              {resultados.map((l) => (
                <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/dashboard/crm/leads/${l.id}`} className="text-sm font-semibold hover:text-accent hover:underline">
                      {l.nome}
                    </Link>
                    <p className="text-xs text-muted">
                      {l.telefone} {l.placa ? `· ${l.placa}` : ""} · Prospector: {l.prospector.nome}
                      {l.sdr ? ` · SDR: ${l.sdr.nome}` : ""}
                      {l.closer ? ` · Closer: ${l.closer.nome}` : ""}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[l.status]}>{STATUS_LABEL[l.status]}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
