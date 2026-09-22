"use client";

import { useActionState } from "react";
import { salvarLancamentoCloserAction, type LancamentoCloserState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const estadoInicial: LancamentoCloserState = {};

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export type LancamentoCloserExistente = {
  data: string;
  oportunidadesRecebidas: number;
  oportunidadesTrabalhadas: number;
  retornos: number;
  contatosProdutivos: number;
  cotacoes: number;
  vendas: number;
  semProdutividade: number;
  observacoes: string | null;
};

const CAMPOS: { nome: keyof Omit<LancamentoCloserExistente, "data" | "observacoes">; label: string }[] = [
  { nome: "oportunidadesRecebidas", label: "Oportunidades recebidas" },
  { nome: "oportunidadesTrabalhadas", label: "Oportunidades trabalhadas" },
  { nome: "retornos", label: "Retornos" },
  { nome: "contatosProdutivos", label: "Contatos produtivos" },
  { nome: "cotacoes", label: "Cotações" },
  { nome: "vendas", label: "Vendas" },
  { nome: "semProdutividade", label: "Sem produtividade" },
];

export function LancamentoCloserForm({ existente }: { existente?: LancamentoCloserExistente }) {
  const [state, formAction, pending] = useActionState(salvarLancamentoCloserAction, estadoInicial);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lançamento diário</CardTitle>
        <p className="mt-1 text-xs text-muted">
          Um lançamento por dia — salvar de novo no mesmo dia atualiza os números.
        </p>
      </CardHeader>

      <form action={formAction} className="space-y-5">
        <div>
          <label className="mb-1 block text-xs text-muted">Data *</label>
          <Input name="data" type="date" required defaultValue={existente?.data ?? hojeISO()} className="max-w-xs" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CAMPOS.map((c) => (
            <div key={c.nome} className="rounded-md border border-border bg-surface-2 p-3">
              <label className="mb-1 block text-xs text-muted">{c.label}</label>
              <input
                name={c.nome}
                type="number"
                min={0}
                defaultValue={existente?.[c.nome] ?? 0}
                className="w-full rounded-md border border-border-strong bg-background px-2 py-2 text-center font-num text-lg font-semibold outline-none focus:border-accent"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted">Observações</label>
          <Input name="observacoes" placeholder="Qualquer detalhe do dia" defaultValue={existente?.observacoes ?? ""} />
        </div>

        {state.erro && (
          <p className="rounded-md border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">{state.erro}</p>
        )}
        {state.ok && (
          <p className="rounded-md border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-teal">
            Lançamento salvo.
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar lançamento"}
        </Button>
      </form>
    </Card>
  );
}
