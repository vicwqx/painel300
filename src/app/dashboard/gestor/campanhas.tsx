"use client";

import { useActionState, useTransition } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { criarCampanhaAction, alternarParticipanteAction, type CriarCampanhaState } from "./actions";

type Pessoa = { id: string; nome: string };
type Entrada = { profileId: string; data: string; cotacoes: number };
type Campanha = {
  id: string;
  nome: string;
  metaValor: number;
  inicio: string;
  fim: string;
  participanteIds: string[];
};

const estadoInicial: CriarCampanhaState = {};

export function CampanhasPanel({
  campanhas,
  pessoas,
  entradas,
}: {
  campanhas: Campanha[];
  pessoas: Pessoa[];
  entradas: Entrada[];
}) {
  const [state, formAction, pending] = useActionState(criarCampanhaAction, estadoInicial);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Nova campanha</CardTitle>
          <p className="mt-1 text-xs text-muted">Meta baseada em cotações no período.</p>
        </CardHeader>
        <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Nome</label>
            <Input name="nome" required placeholder="Ex: Campanha Happy Hour" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Meta (cotações)</label>
            <Input name="metaValor" type="number" min={1} required placeholder="90" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Início</label>
              <Input name="inicio" type="date" required />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Fim</label>
              <Input name="fim" type="date" required />
            </div>
          </div>
          <div className="sm:col-span-4">
            {state.erro && <p className="mb-2 text-sm text-red">{state.erro}</p>}
            {state.ok && <p className="mb-2 text-sm text-teal">Campanha criada.</p>}
            <Button type="submit" disabled={pending}>
              {pending ? "Criando..." : "Criar campanha"}
            </Button>
          </div>
        </form>
      </Card>

      {campanhas.map((c) => {
        const participantSet = new Set(c.participanteIds);
        const hoje = new Date().toISOString().slice(0, 10);
        const rows = pessoas
          .filter((p) => participantSet.has(p.id))
          .map((p) => {
            const cot = entradas
              .filter((e) => e.profileId === p.id && e.data >= c.inicio && e.data <= (c.fim < hoje ? c.fim : hoje))
              .reduce((sum, e) => sum + e.cotacoes, 0);
            return { nome: p.nome, cot };
          })
          .sort((a, b) => b.cot - a.cot);

        return (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle>🍻 {c.nome}</CardTitle>
              <p className="mt-1 text-xs text-muted">
                {c.metaValor} cotações · {c.inicio} a {c.fim}
              </p>
            </CardHeader>

            <div className="mb-4">
              <div className="mb-2 text-xs uppercase tracking-wide text-muted">Quem participa</div>
              <div className="flex flex-wrap gap-1.5">
                {pessoas.map((p) => {
                  const on = participantSet.has(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() =>
                        startTransition(() => {
                          alternarParticipanteAction(c.id, p.id, !on);
                        })
                      }
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                        on ? "border-amber text-amber" : "border-border-strong text-text-2"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-amber" : "bg-border-strong"}`} />
                      {p.nome}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-muted">Progresso</div>
              {rows.length === 0 ? (
                <p className="text-sm text-muted">Ninguém foi adicionado ainda.</p>
              ) : (
                rows.map((r) => {
                  const pct = Math.min(100, (r.cot / c.metaValor) * 100);
                  const atingiu = r.cot >= c.metaValor;
                  return (
                    <div key={r.nome} className="mb-2">
                      <div className="mb-1 flex justify-between text-xs">
                        <span>{r.nome}</span>
                        <span className={atingiu ? "text-teal" : "text-text-2"}>
                          {r.cot} / {c.metaValor}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: atingiu ? "var(--teal)" : "var(--amber)" }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
