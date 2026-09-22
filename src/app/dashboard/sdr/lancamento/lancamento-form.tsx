"use client";

import { useActionState, useRef, useEffect } from "react";
import { criarLancamentoSdrAction, editarLancamentoSdrAction, type LancamentoSdrState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const estadoInicial: LancamentoSdrState = {};

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export type LancamentoExistente = {
  id: string;
  data: string;
  nome: string;
  telefone: string | null;
  cep: string | null;
  cidade: string | null;
  placa: string | null;
  modelo: string | null;
  ano: string | null;
  origem: string | null;
  tipoAtividade: "OPORTUNIDADE" | "QUALIFICACAO";
  tipoUso: "PARTICULAR" | "APLICATIVO" | null;
  temSeguro: boolean | null;
  seguroAtual: string | null;
  motivo: string | null;
  observacao: string | null;
  temperatura: "FRIO" | "MORNO" | "QUENTE" | null;
};

export function LancamentoSdrForm({ existente }: { existente?: LancamentoExistente }) {
  const action = existente ? editarLancamentoSdrAction.bind(null, existente.id) : criarLancamentoSdrAction;
  const [state, formAction, pending] = useActionState(action, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && !existente) formRef.current?.reset();
  }, [state.ok, existente]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existente ? "Editar lançamento" : "Novo lançamento"}</CardTitle>
        <p className="mt-1 text-xs text-muted">Registre em poucos segundos — sem fila, sem transferência.</p>
      </CardHeader>

      <form ref={formRef} action={formAction} className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Data *</label>
            <Input name="data" type="date" required defaultValue={existente?.data ?? hojeISO()} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-muted">Nome *</label>
            <Input name="nome" required defaultValue={existente?.nome} placeholder="Nome do cliente" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input name="telefone" placeholder="Telefone" defaultValue={existente?.telefone ?? ""} />
          <Input name="cep" placeholder="CEP ou cidade" defaultValue={existente?.cep ?? existente?.cidade ?? ""} />
          <Input name="placa" placeholder="Placa" defaultValue={existente?.placa ?? ""} />
          <Input name="modelo" placeholder="Modelo" defaultValue={existente?.modelo ?? ""} />
          <Input name="ano" placeholder="Ano" defaultValue={existente?.ano ?? ""} />
          <Input name="origem" placeholder="Origem" defaultValue={existente?.origem ?? ""} />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Tipo de atividade *</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="tipoAtividade"
                value="OPORTUNIDADE"
                required
                defaultChecked={!existente || existente.tipoAtividade === "OPORTUNIDADE"}
              />
              Oportunidade
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="tipoAtividade"
                value="QUALIFICACAO"
                defaultChecked={existente?.tipoAtividade === "QUALIFICACAO"}
              />
              Qualificação
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted">Tipo de uso</label>
            <select
              name="tipoUso"
              defaultValue={existente?.tipoUso ?? ""}
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="">Não informado</option>
              <option value="PARTICULAR">Particular</option>
              <option value="APLICATIVO">Aplicativo</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Tem seguro?</label>
            <select
              name="temSeguro"
              defaultValue={existente?.temSeguro === null || existente?.temSeguro === undefined ? "" : existente.temSeguro ? "sim" : "nao"}
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="">Não perguntado</option>
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          </div>
          <Input name="seguroAtual" placeholder="Qual seguro?" defaultValue={existente?.seguroAtual ?? ""} />
          <Input name="motivo" placeholder="Motivo da troca / nova cotação" defaultValue={existente?.motivo ?? ""} />
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted">Observação</label>
          <Input name="observacao" placeholder="Qualquer detalhe relevante" defaultValue={existente?.observacao ?? ""} />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Temperatura</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-sm">
              <input type="radio" name="temperatura" value="FRIO" defaultChecked={existente?.temperatura === "FRIO"} /> 🔵 Frio
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="radio" name="temperatura" value="MORNO" defaultChecked={existente?.temperatura === "MORNO"} /> 🟡 Morno
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="radio" name="temperatura" value="QUENTE" defaultChecked={existente?.temperatura === "QUENTE"} /> 🔴 Quente
            </label>
          </div>
        </div>

        {state.erro && (
          <p className="rounded-md border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">{state.erro}</p>
        )}
        {state.ok && (
          <p className="rounded-md border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-teal">
            {existente ? "Lançamento atualizado." : "Lançamento registrado."}
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : existente ? "Salvar alterações" : "Registrar lançamento"}
        </Button>
      </form>
    </Card>
  );
}
