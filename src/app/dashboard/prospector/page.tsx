import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria } from "@/lib/crm/sessao";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NovoLeadForm } from "./novo-lead-form";
import { STATUS_LABEL, STATUS_TONE, TEMPERATURA_EMOJI } from "@/lib/crm/labels";
import Link from "next/link";
import type { CrmLeadStatus } from "@prisma/client";

function dataISO(d: Date) {
  return d.toISOString().slice(0, 10);
}
function inicioDoDia() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function inicioDaSemana() {
  const d = inicioDoDia();
  const diaDaSemana = d.getDay();
  const diff = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;
  d.setDate(d.getDate() + diff);
  return d;
}
function inicioDoMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

const STATUS_EM_ANDAMENTO: CrmLeadStatus[] = ["AGUARDANDO_SDR", "EM_QUALIFICACAO"];
const STATUS_QUALIFICADO_EM_DIANTE: CrmLeadStatus[] = [
  "QUALIFICADO",
  "AGUARDANDO_CLOSER",
  "DISTRIBUIDO_CLOSER",
  "EM_CONTATO",
  "COTACAO",
  "NEGOCIACAO",
  "VENDA",
];

export default async function ProspectorPage() {
  const sessao = await sessaoCrmObrigatoria();

  const [hoje, semana, mes, total, emAndamento, qualificados, convertidos, ultimosLeads] = await Promise.all([
    prisma.crmLead.count({ where: { prospectorId: sessao.profileId, criadoEm: { gte: inicioDoDia() } } }),
    prisma.crmLead.count({ where: { prospectorId: sessao.profileId, criadoEm: { gte: inicioDaSemana() } } }),
    prisma.crmLead.count({ where: { prospectorId: sessao.profileId, criadoEm: { gte: inicioDoMes() } } }),
    prisma.crmLead.count({ where: { prospectorId: sessao.profileId } }),
    prisma.crmLead.count({ where: { prospectorId: sessao.profileId, status: { in: STATUS_EM_ANDAMENTO } } }),
    prisma.crmLead.count({
      where: { prospectorId: sessao.profileId, status: { in: STATUS_QUALIFICADO_EM_DIANTE } },
    }),
    prisma.crmLead.count({ where: { prospectorId: sessao.profileId, status: "VENDA" } }),
    prisma.crmLead.findMany({
      where: { prospectorId: sessao.profileId },
      orderBy: { criadoEm: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Olá, {sessao.nome.split(" ")[0]}</h1>
        <p className="text-sm text-muted">Sua produção de prospecção.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniKpi label="Cadastrados hoje" valor={hoje} />
        <MiniKpi label="Cadastrados na semana" valor={semana} />
        <MiniKpi label="Cadastrados no mês" valor={mes} />
        <MiniKpi label="Total enviado ao SDR" valor={total} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniKpi label="Em andamento" valor={emAndamento} />
        <MiniKpi label="Qualificados" valor={qualificados} tom="amber" />
        <MiniKpi label="Convertidos em venda" valor={convertidos} tom="teal" />
      </div>

      <NovoLeadForm />

      <Card>
        <CardHeader>
          <CardTitle>Meus leads recentes</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="py-2 pr-3 font-medium">Nome</th>
                <th className="py-2 pr-3 font-medium">Telefone</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Temp.</th>
                <th className="py-2 pr-3 font-medium">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ultimosLeads.map((l) => (
                <tr key={l.id}>
                  <td className="py-2 pr-3 font-medium">
                    <Link href={`/dashboard/crm/leads/${l.id}`} className="hover:text-accent hover:underline">
                      {l.nome}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 font-num text-muted">{l.telefone}</td>
                  <td className="py-2 pr-3">
                    <Badge tone={STATUS_TONE[l.status]}>{STATUS_LABEL[l.status]}</Badge>
                  </td>
                  <td className="py-2 pr-3">{l.temperatura ? TEMPERATURA_EMOJI[l.temperatura] : "—"}</td>
                  <td className="py-2 pr-3 text-muted">{dataISO(l.criadoEm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ultimosLeads.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">Você ainda não cadastrou nenhum lead.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function MiniKpi({ label, valor, tom }: { label: string; valor: number; tom?: "teal" | "amber" }) {
  const cor = tom === "teal" ? "text-teal" : tom === "amber" ? "text-amber" : "text-foreground";
  return (
    <Card className="p-4">
      <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className={`font-num text-2xl font-semibold ${cor}`}>{valor}</p>
    </Card>
  );
}
