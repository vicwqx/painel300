"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

const estadoInicial: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, estadoInicial);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-md border border-border border-t-2 border-t-amber bg-surface p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber font-mono text-lg font-bold text-[#1a1200]">
            L
          </div>
          <div>
            <h1 className="text-base font-semibold">Painel 300</h1>
            <p className="text-xs uppercase tracking-wide text-muted">Loma Proteção Veicular</p>
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
              E-mail
            </label>
            <Input name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
              Senha
            </label>
            <Input name="password" type="password" required autoComplete="current-password" />
          </div>

          {state.erro && (
            <p className="rounded-md border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">
              {state.erro}
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
