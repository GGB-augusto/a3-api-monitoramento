const FORMATO_NUMERO_BRASILEIRO = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/;

export function interpretarNumeroBrasileiro(valor: string): number | null {
  const normalizado = valor.trim();
  if (!FORMATO_NUMERO_BRASILEIRO.test(normalizado)) return null;

  const numero = Number(normalizado.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(numero) ? numero : null;
}

export function formatarNumeroBrasileiro(valor?: number): string {
  if (valor === undefined) return '';
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 20 }).format(valor);
}

export function filtrarEntradaNumericaBrasileira(valor: string): string | null {
  return /^[\d.,]*$/.test(valor) ? valor : null;
}
