"use client";

import { useActionState } from "react";
import { salvarLancamentoAction, type SalvarLancamentoState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Valores = {
  prospeccoes: number;
  indicacoes: number;
  ligacoes: number;
  atendidas: number;
  cotacoes: number;
  followup: number;
  vendas: number;
  ativas: number;
} | null;

const campos: { nome: keyof NonNullable<Valores>; label: string; meta?: number }[] = [
  { nome: "prospeccoes", label: "Prospecções" },
  { nome: "indicacoes", label: "Indicações" },
  { nome: "ligacoes", label: "Ligações", meta: 150 },
  { nome: "atendidas", label: "Atendidas" },
  { nome: "cotacoes", label: "Cotações", meta: 10 },
  { nome: "followup", label: "Followup" },
  { nome: "vendas", label: "Vendas", meta: 2 },
  { nome: "ativas", label: "Ativas" },
];

const estadoInicial: SalvarLancamentoState = {};

export function LancamentoForm({
  dataInicial,
  valoresIniciais,
}: {
  dataInicial: string;
  valoresIniciais: Valores;
}) {
  const [state, formAction, pending] = useActionState(salvarLancamentoAction, estadoInicial);

  return (
    <Card>
      <form action={formAction} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
            Data
          </label>
          <Input name="data" type="date" defaultValue={dataInicial} required />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {campos.map((c) => (
            <div key={c.nome} className="rounded-md border border-border bg-surface-2 p-3">
              <label className="mb-1 block text-xs text-muted">
                {c.label}
                {c.meta && <span className="text-muted-2"> (meta {c.meta})</span>}
              </label>
              <input
                name={c.nome}
                type="number"
                min={0}
                defaultValue={valoresIniciais?.[c.nome] ?? 0}
                className="w-full rounded-md border border-border-strong bg-background px-2 py-2 text-center font-num text-lg font-semibold outline-none focus:border-amber"
              />
            </div>
          ))}
        </div>

        {state.erro && <p className="text-sm text-red">{state.erro}</p>}
        {state.ok && <p className="text-sm text-teal">Lançamento salvo.</p>}

        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar lançamento"}
        </Button>
      </form>
    </Card>
  );
}
