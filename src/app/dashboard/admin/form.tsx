"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { criarUsuarioAction, type CriarUsuarioState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const estadoInicial: CriarUsuarioState = {};

export function CriarUsuarioForm() {
  const [state, formAction, pending] = useActionState(criarUsuarioAction, estadoInicial);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
            Nome
          </label>
          <Input name="nome" required placeholder="Nome completo" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
            E-mail
          </label>
          <Input name="email" type="email" required placeholder="pessoa@loma.com.br" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
            Senha inicial
          </label>
          <Input name="senha" type="text" required placeholder="Mínimo 6 caracteres" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
            Cargo
          </label>
          <select
            name="cargo"
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-amber"
            defaultValue="JUNIOR"
          >
            <option value="JUNIOR">Junior</option>
            <option value="SENIOR">Senior</option>
            <option value="MASTER">Master</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
            Papel no sistema
          </label>
          <select
            name="role"
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-amber"
            defaultValue="EXECUTIVO"
          >
            <option value="EXECUTIVO">Executivo (Equipe 300)</option>
            <option value="GESTOR">Gestor (Equipe 300)</option>
            <option value="SDR">SDR</option>
            <option value="CLOSER">Closer</option>
            <option value="GERENTE">Gerente (equipe única)</option>
            <option value="PROSPECTOR">Prospector (legado)</option>
            <option value="GERENTE_PROSPECTOR">Gerente de Prospector (legado)</option>
            <option value="GERENTE_SDR">Gerente de SDR (legado)</option>
            <option value="GERENTE_CLOSER">Gerente de Closer (legado)</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      {state.erro && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md border border-red/30 bg-red/10 px-3 py-2 text-sm text-red"
        >
          {state.erro}
        </motion.p>
      )}
      {state.ok && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-teal"
        >
          Usuário criado com sucesso.
        </motion.p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Criando..." : "Criar usuário"}
      </Button>
    </form>
  );
}
