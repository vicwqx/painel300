"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function SimuladorCenarios({
  teamSize,
  vendasMTD,
  avgLigacoesPerRepPerDay,
  convLC,
  convCV,
  daysLeft,
  metaVendas,
  projecaoAtual,
}: {
  teamSize: number;
  vendasMTD: number;
  avgLigacoesPerRepPerDay: number;
  convLC: number;
  convCV: number;
  daysLeft: number;
  metaVendas: number;
  projecaoAtual: number;
}) {
  const [deltaConv, setDeltaConv] = useState(0);
  const [extraReps, setExtraReps] = useState(0);
  const [extraCalls, setExtraCalls] = useState(0);

  const newTeamSize = teamSize + extraReps;
  const newLigacoesPerRepPerDay = Math.max(0, avgLigacoesPerRepPerDay + extraCalls);
  const newConvCV = Math.max(0, convCV + deltaConv / 100);
  const newVendasPerDay = newLigacoesPerRepPerDay * newTeamSize * convLC * newConvCV;
  const simulatedTotal = Math.round(vendasMTD + newVendasPerDay * daysLeft);
  const diff = simulatedTotal - projecaoAtual;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulador de cenários</CardTitle>
        <p className="mt-1 text-xs text-muted">
          Mexa nas variáveis e veja o impacto na meta de {metaVendas} vendas do mês.
        </p>
      </CardHeader>

      <div className="space-y-5">
        <div>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-muted">Conversão cotação → venda</span>
            <span className="font-num font-semibold text-amber">
              {deltaConv >= 0 ? "+" : ""}
              {deltaConv.toFixed(1)} p.p.
            </span>
          </div>
          <input
            type="range"
            min={-10}
            max={10}
            step={0.5}
            value={deltaConv}
            onChange={(e) => setDeltaConv(parseFloat(e.target.value))}
            className="w-full accent-amber"
          />
        </div>

        <div>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-muted">Vendedores adicionais</span>
            <span className="font-num font-semibold text-amber">
              {extraReps >= 0 ? "+" : ""}
              {extraReps}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            step={1}
            value={extraReps}
            onChange={(e) => setExtraReps(parseInt(e.target.value))}
            className="w-full accent-amber"
          />
        </div>

        <div>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-muted">Ligações extra / vendedor / dia</span>
            <span className="font-num font-semibold text-amber">
              {extraCalls >= 0 ? "+" : ""}
              {extraCalls}
            </span>
          </div>
          <input
            type="range"
            min={-50}
            max={100}
            step={5}
            value={extraCalls}
            onChange={(e) => setExtraCalls(parseInt(e.target.value))}
            className="w-full accent-amber"
          />
        </div>

        <div className="rounded-md border-l-2 border-border-strong bg-surface-2 p-4">
          <p className="mb-1 text-[11px] uppercase tracking-wide text-muted">
            Projeção simulada de fechamento
          </p>
          <p className="font-num text-3xl font-semibold">{simulatedTotal}</p>
          <p className="mt-1 text-xs text-muted">
            vs. projeção atual ({projecaoAtual}):{" "}
            <b className={diff > 0 ? "text-teal" : diff < 0 ? "text-red" : "text-foreground"}>
              {diff > 0 ? "+" : ""}
              {diff}
            </b>{" "}
            · meta: {metaVendas}
          </p>
        </div>
      </div>
    </Card>
  );
}
