"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export type SerieDia = { dia: string; [chave: string]: string | number };

const CORES = ["#4C9FFF", "#9B8CFF", "#00D9A3", "#F5A623", "#FF9FD1", "#C7B08A"];

export function TrendChart({ dados, chaves }: { dados: SerieDia[]; chaves: string[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={dados} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#242931" vertical={false} />
        <XAxis dataKey="dia" tick={{ fill: "#8B94A0", fontSize: 11 }} axisLine={{ stroke: "#242931" }} tickLine={false} />
        <YAxis tick={{ fill: "#8B94A0", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "#181C22", border: "1px solid #242931", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#E4E7EB" }}
        />
        {chaves.map((chave, i) => (
          <Line
            key={chave}
            type="monotone"
            dataKey={chave}
            stroke={CORES[i % CORES.length]}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
