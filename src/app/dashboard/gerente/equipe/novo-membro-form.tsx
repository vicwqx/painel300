"use client";

import { useActionState, useRef, useEffect } from "react";
import { criarMembroEquipeAction } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function NovoMembroForm() {
  const [state, formAction, pending] = useActionState(criarMembroEquipeAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo membro da equipe</CardTitle>
        <p className="mt-1 text-xs text-muted">Cria login e perfil de SDR ou Closer.</p>
      </CardHeader>
      <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Input name="nome" required placeholder="Nome completo" />
        <Input name="email" type="email" required placeholder="E-mail" />
        <Input name="senha" required placeholder="Senha inicial" />
        <select
          name="papel"
          required
          defaultValue=""
          className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        >
          <option value="" disabled>
            Papel
          </option>
          <option value="SDR">SDR</option>
          <option value="CLOSER">Closer</option>
        </select>
        <div className="sm:col-span-4">
          {state.erro && (
            <p className="mb-2 rounded-md border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">{state.erro}</p>
          )}
          {state.ok && (
            <p className="mb-2 rounded-md border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-teal">
              Usuário criado com sucesso.
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Criando..." : "Criar usuário"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
