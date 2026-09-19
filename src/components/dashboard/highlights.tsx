import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export type Destaque = { rotulo: string; nome: string; valor: string };

export function Highlights({ destaques }: { destaques: Destaque[] }) {
  if (destaques.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Destaques</CardTitle>
      </CardHeader>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {destaques.map((d) => (
          <div key={d.rotulo} className="rounded-md border border-border bg-surface-2 p-3">
            <p className="mb-1.5 text-[10px] uppercase tracking-wide text-muted-2">{d.rotulo}</p>
            <p className="truncate text-sm font-semibold text-foreground">{d.nome}</p>
            <p className="font-num text-xs text-accent">{d.valor}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
