"use client";

import { useActionState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

type EstadoForm = { erro?: string; ok?: boolean };

export function NovoUsuarioForm({
  action,
  titulo,
  descricao,
}: {
  action: (state: EstadoForm, formData: FormData) => Promise<EstadoForm>;
  titulo: string;
  descricao: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <p className="mt-1 text-xs text-muted">{descricao}</p>
      </CardHeader>
      <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input name="nome" required placeholder="Nome completo" />
        <Input name="email" type="email" required placeholder="E-mail" />
        <Input name="senha" required placeholder="Senha inicial" />
        <div className="sm:col-span-3">
          {state.erro && (
            <p className="mb-2 rounded-md border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">
              {state.erro}
            </p>
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
