import type { Cargo } from "@prisma/client";

export type ComissaoConfigPorCargo = {
  cargo: Cargo;
  fixo: number;
  ticketMedio: number;
  bonusAtivasLimite: number;
  bonusValor: number;
};

export type ResultadoComissao = {
  fixo: number;
  pontoDeVirada: number;
  vendasExtras: number;
  comissaoExtra: number;
  bonusAtingido: boolean;
  bonusValor: number;
  total: number;
};

/**
 * Regra da Loma: o fixo é sempre pago. A partir do momento em que as adesões
 * (vendas) do mês superam o "ponto de virada" (fixo ÷ ticket médio), cada
 * adesão adicional gera 100% do ticket médio como comissão extra. Bônus é
 * pago à parte se a pessoa bater o número de "ativas" do mês, por cargo.
 */
export function calcularComissao(
  config: ComissaoConfigPorCargo,
  vendasNoMes: number,
  ativasNoMes: number
): ResultadoComissao {
  const pontoDeVirada = config.fixo / config.ticketMedio;
  const vendasExtras = Math.max(0, vendasNoMes - pontoDeVirada);
  const comissaoExtra = vendasExtras * config.ticketMedio;
  const bonusAtingido = ativasNoMes >= config.bonusAtivasLimite;
  const bonusValor = bonusAtingido ? config.bonusValor : 0;

  return {
    fixo: config.fixo,
    pontoDeVirada,
    vendasExtras,
    comissaoExtra,
    bonusAtingido,
    bonusValor,
    total: config.fixo + comissaoExtra + bonusValor,
  };
}
