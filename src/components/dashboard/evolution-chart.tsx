"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export type PontoEvolucao = { dia: string; vendas: number; cotacoes: number; prospeccoes: number };

const METRICAS = [
  { key: "vendas" as const, label: "Vendas", cor: "var(--positive)" },
  { key: "cotacoes" as const, label: "Cotações", cor: "var(--chart-2)" },
  { key: "prospeccoes" as const, label: "Prospecções", cor: "var(--chart-4)" },
];

export function EvolutionChart({ dados }: { dados: PontoEvolucao[] }) {
  const [metrica, setMetrica] = useState<(typeof METRICAS)[number]["key"]>("vendas");
  const ativa = METRICAS.find((m) => m.key === metrica)!;

  return (
    <div>
      <div className="mb-4 inline-flex items-center rounded-lg border border-border bg-surface-2 p-0.5">
        {METRICAS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetrica(m.key)}
            className={`rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors ${
              metrica === m.key ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={dados} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="dia" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--surface-3)",
              border: "1px solid var(--border-strong)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--foreground)", marginBottom: 4 }}
          />
          <Line
            type="monotone"
            dataKey={metrica}
            stroke={ativa.cor}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
            animationDuration={400}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
