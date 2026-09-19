"use client";

import { useActionState } from "react";
import { qualificarLeadAction, descartarLeadAction, type QualificarLeadState } from "../actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOTIVOS_DESCARTE } from "@/lib/crm/labels";
import type { CrmLeadStatus } from "@prisma/client";

const estadoInicial: QualificarLeadState = {};

export function QualificacaoForm({ leadId }: { leadId: string }) {
  const qualificarComId = qualificarLeadAction.bind(null, leadId);
  const [state, formAction, pending] = useActionState(qualificarComId, estadoInicial);

  const router = useRouter();
  const [descartando, startDescarte] = useTransition();
  const [motivoDescarte, setMotivoDescarte] = useState<CrmLeadStatus | "">("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Qualificação</CardTitle>
      </CardHeader>

      <form action={formAction} className="space-y-5">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="clienteRespondeu" value="true" className="h-4 w-4" />
          Cliente respondeu ao contato
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Interesse</label>
            <Input name="interesse" placeholder="O que o cliente disse que quer" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Modelo do veículo</label>
            <Input name="modeloVeiculo" placeholder="Honda Civic" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Ano</label>
            <Input name="anoVeiculo" placeholder="2020" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">CEP</label>
            <Input name="cep" placeholder="00000-000" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Cidade</label>
            <Input name="cidade" placeholder="São Paulo" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Possui seguro atualmente?</label>
            <select
              name="possuiSeguro"
              defaultValue=""
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="">Não perguntado</option>
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Seguradora atual</label>
            <Input name="seguradoraAtual" placeholder="Se houver" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Motivo da troca</label>
            <Input name="motivoTroca" placeholder="Preço, atendimento..." />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Melhor horário de contato</label>
            <Input name="melhorHorario" placeholder="Após 18h" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Observações</label>
          <Input name="observacoes" placeholder="Qualquer detalhe relevante pro closer" />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Temperatura *</p>
          <div className="flex gap-3">
            <label className="flex items-center gap-1.5 text-sm">
              <input type="radio" name="temperatura" value="FRIO" required /> 🔵 Frio
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="radio" name="temperatura" value="MORNO" /> 🟡 Morno
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="radio" name="temperatura" value="QUENTE" /> 🔴 Quente
            </label>
          </div>
        </div>

        {state.erro && <p className="text-sm text-red">{state.erro}</p>}
        {state.ok && <p className="text-sm text-teal">Lead qualificado e enviado pro closer.</p>}

        <Button type="submit" disabled={pending}>
          {pending ? "Enviando..." : "Qualificar e enviar para closer"}
        </Button>
      </form>

      <div className="mt-6 border-t border-border pt-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Ou descartar esse lead</p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={motivoDescarte}
            onChange={(e) => setMotivoDescarte(e.target.value as CrmLeadStatus)}
            className="rounded-md border border-border-strong bg-surface-2 px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
          >
            <option value="">Selecione o motivo...</option>
            {MOTIVOS_DESCARTE.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="danger"
            disabled={!motivoDescarte || descartando}
            className="px-3 py-1.5 text-xs"
            onClick={() => {
              if (!motivoDescarte) return;
              if (!confirm("Descartar esse lead? Essa ação não pode ser desfeita.")) return;
              startDescarte(async () => {
                await descartarLeadAction(leadId, motivoDescarte as CrmLeadStatus);
                router.push("/dashboard/sdr");
              });
            }}
          >
            {descartando ? "Descartando..." : "Descartar lead"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
