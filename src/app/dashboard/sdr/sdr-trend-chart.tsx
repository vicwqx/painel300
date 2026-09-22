"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export type PontoSdr = { dia: string; ligacoes: number; oportunidades: number; qualificacoes: number };

export function SdrTrendChart({ dados }: { dados: PontoSdr[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
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
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="ligacoes" name="Ligações" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="oportunidades" name="Oportunidades" stroke="var(--accent)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="qualificacoes" name="Qualificações" stroke="var(--positive)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
