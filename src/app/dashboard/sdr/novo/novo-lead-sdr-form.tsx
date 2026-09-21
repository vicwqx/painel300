"use client";

import { useActionState } from "react";
import { criarEQualificarLeadAction, type CriarEQualificarLeadState } from "../actions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const estadoInicial: CriarEQualificarLeadState = {};

export function NovoLeadSdrForm() {
  const [state, formAction, pending] = useActionState(criarEQualificarLeadAction, estadoInicial);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      const t = setTimeout(() => router.push("/dashboard/sdr"), 900);
      return () => clearTimeout(t);
    }
  }, [state.ok, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo lead (contato direto)</CardTitle>
        <p className="mt-1 text-xs text-muted">
          Pra quando você já tem o contato e não precisa passar pela fila do prospector — o lead já sai qualificado,
          direto pra distribuição do closer.
        </p>
      </CardHeader>

      <form action={formAction} className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Dados do cliente</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input name="nome" required placeholder="Nome do cliente *" />
            <Input name="telefone" required placeholder="Telefone *" />
            <Input name="placa" placeholder="Placa" />
            <Input name="modeloVeiculo" placeholder="Modelo do veículo" />
            <Input name="anoVeiculo" placeholder="Ano" />
            <Input name="cidade" placeholder="Cidade" />
            <Input name="cep" placeholder="CEP" />
            <Input name="origem" placeholder="Origem (ex: WhatsApp, indicação...)" />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Qualificação</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input name="interesse" placeholder="Interesse (o que o cliente quer)" />
            <select
              name="possuiSeguro"
              defaultValue=""
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="">Possui seguro atualmente? (não perguntado)</option>
              <option value="sim">Possui seguro: Sim</option>
              <option value="nao">Possui seguro: Não</option>
            </select>
            <Input name="seguradoraAtual" placeholder="Seguradora atual (se houver)" />
            <Input name="motivoTroca" placeholder="Motivo da troca" />
            <Input name="melhorHorario" placeholder="Melhor horário de contato" />
          </div>
          <div className="mt-3">
            <Input name="observacoes" placeholder="Observações" />
          </div>
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

        {state.erro && (
          <p className="rounded-md border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">{state.erro}</p>
        )}
        {state.ok && (
          <p className="rounded-md border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-teal">
            Lead criado e enviado direto pro closer!
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Enviando..." : "Criar e enviar para o closer"}
        </Button>
      </form>
    </Card>
  );
}
