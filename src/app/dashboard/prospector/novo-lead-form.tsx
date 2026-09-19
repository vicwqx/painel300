"use client";

import { useActionState, useRef, useEffect } from "react";
import { criarLeadCrmAction, type CriarLeadCrmState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const estadoInicial: CriarLeadCrmState = {};

export function NovoLeadForm() {
  const [state, formAction, pending] = useActionState(criarLeadCrmAction, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>+ Novo lead</CardTitle>
        <p className="mt-1 text-xs text-muted">
          Cadastre rápido — o lead já entra direto na fila do SDR.
        </p>
      </CardHeader>

      <form ref={formRef} action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
              Nome *
            </label>
            <Input name="nome" required placeholder="Nome do cliente" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
              Telefone *
            </label>
            <Input name="telefone" required placeholder="(11) 90000-0000" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
              Placa
            </label>
            <Input name="placa" placeholder="ABC1D23" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
              Modelo
            </label>
            <Input name="modeloVeiculo" placeholder="Honda Civic" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
              Ano
            </label>
            <Input name="anoVeiculo" placeholder="2020" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
              Cidade
            </label>
            <Input name="cidade" placeholder="São Paulo" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
              Origem
            </label>
            <Input name="origem" placeholder="Instagram, indicação..." />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
              Observação
            </label>
            <Input name="observacaoInicial" placeholder="Cliente pediu cotação..." />
          </div>
        </div>

        {state.erro && (
          <p className="rounded-md border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">
            {state.erro}
          </p>
        )}
        {state.ok && (
          <p className="rounded-md border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-teal">
            Lead cadastrado e enviado pra fila do SDR.
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Cadastrar lead"}
        </Button>
      </form>
    </Card>
  );
}
