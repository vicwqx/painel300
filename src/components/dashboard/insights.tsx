import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export function Insights({ frases }: { frases: string[] }) {
  if (frases.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights</CardTitle>
      </CardHeader>
      <ul className="space-y-2.5">
        {frases.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
            <Lightbulb size={15} className="mt-0.5 shrink-0 text-accent" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
