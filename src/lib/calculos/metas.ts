export const META_DIARIA = { cotacoes: 10, ligacoes: 150, vendas: 2 } as const;
export const REGRA_ESTRELA_SEMANAL = { cotacoes: 30, ativas: 4 } as const;

export type LancamentoParcial = {
  cotacoes: number;
  ligacoes: number;
  vendas: number;
  ativas?: number;
};

export function bateuMetaDoDia(l: LancamentoParcial): boolean {
  return (
    l.cotacoes >= META_DIARIA.cotacoes &&
    l.ligacoes >= META_DIARIA.ligacoes &&
    l.vendas >= META_DIARIA.vendas
  );
}

export function bateuEstrelaDaSemana(totalCotacoes: number, totalAtivas: number): boolean {
  return (
    totalCotacoes >= REGRA_ESTRELA_SEMANAL.cotacoes &&
    totalAtivas >= REGRA_ESTRELA_SEMANAL.ativas
  );
}

/** Segunda-feira (00:00) da semana que contém `data`. */
export function segundaFeiraDaSemana(data: Date): Date {
  const d = new Date(data);
  const diaDaSemana = d.getDay(); // 0=Dom..6=Sáb
  const diff = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Projeção linear simples: ritmo até agora, repetido até o fim do intervalo. */
export function projecaoLinear(valorAteAgora: number, diasPassados: number, diasTotais: number): number {
  if (diasPassados <= 0) return 0;
  return Math.round((valorAteAgora / diasPassados) * diasTotais);
}
