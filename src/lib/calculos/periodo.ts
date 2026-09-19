export function isoHoje(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function somarDias(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export type PeriodoKey = "hoje" | "7dias" | "30dias" | "mes" | "mes_passado" | "tudo" | "personalizado";

/**
 * O "mês" da Loma não é o mês de calendário — vai do dia 27 de um mês ao
 * dia 26 do mês seguinte. Essas duas funções calculam esse ciclo a partir
 * de uma data de referência (string ISO yyyy-mm-dd).
 */
export function inicioCiclo(refIso: string): string {
  const d = new Date(refIso + "T00:00:00");
  const dia = d.getDate();
  const ano = d.getFullYear();
  const mes = d.getMonth();
  const inicio = dia >= 27 ? new Date(ano, mes, 27) : new Date(ano, mes - 1, 27);
  return inicio.toISOString().slice(0, 10);
}

export function fimCiclo(inicioCicloIso: string): string {
  const d = new Date(inicioCicloIso + "T00:00:00");
  const fim = new Date(d.getFullYear(), d.getMonth() + 1, 26);
  return fim.toISOString().slice(0, 10);
}

/** Calcula [inicio, fim] em ISO (yyyy-mm-dd) para um período nomeado. */
export function calcularPeriodo(
  periodo: string,
  personalizadoInicio?: string,
  personalizadoFim?: string
): { inicio: string; fim: string; label: string } {
  const hoje = isoHoje();

  switch (periodo) {
    case "hoje":
      return { inicio: hoje, fim: hoje, label: "Hoje" };
    case "7dias":
      return { inicio: somarDias(hoje, -6), fim: hoje, label: "Últimos 7 dias" };
    case "30dias":
      return { inicio: somarDias(hoje, -29), fim: hoje, label: "Últimos 30 dias" };
    case "mes_passado": {
      const inicioAtual = inicioCiclo(hoje);
      const inicioAnterior = new Date(inicioAtual + "T00:00:00");
      inicioAnterior.setMonth(inicioAnterior.getMonth() - 1);
      const inicioAnteriorIso = inicioAnterior.toISOString().slice(0, 10);
      const fimAnteriorIso = somarDias(inicioAtual, -1);
      return { inicio: inicioAnteriorIso, fim: fimAnteriorIso, label: "Mês passado" };
    }
    case "tudo":
      return { inicio: "2020-01-01", fim: hoje, label: "Todo o período" };
    case "personalizado":
      if (personalizadoInicio && personalizadoFim) {
        return { inicio: personalizadoInicio, fim: personalizadoFim, label: "Personalizado" };
      }
      return { inicio: inicioCiclo(hoje), fim: hoje, label: "Mês atual" };
    case "mes":
    default: {
      const inicio = inicioCiclo(hoje);
      return { inicio, fim: hoje, label: "Mês atual" };
    }
  }
}
