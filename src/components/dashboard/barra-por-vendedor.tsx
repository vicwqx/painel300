"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export type ItemBarra = { nome: string; valor: number };

export function BarraPorVendedor({ dados, cor = "#00D9A3" }: { dados: ItemBarra[]; cor?: string }) {
  const ordenado = [...dados].sort((a, b) => b.valor - a.valor);
  const altura = Math.max(120, ordenado.length * 32);

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={ordenado} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
        <CartesianGrid stroke="#242931" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#8B94A0", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="nome"
          width={110}
          tick={{ fill: "#E4E7EB", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ background: "#181C22", border: "1px solid #242931", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#E4E7EB" }}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
          {ordenado.map((_, i) => (
            <Cell key={i} fill={cor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
