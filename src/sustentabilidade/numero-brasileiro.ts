const FORMATO_NUMERO_BRASILEIRO = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/;

export function interpretarNumeroBrasileiro(valor: unknown): unknown {
  if (typeof valor !== 'string') return valor;
  const normalizado = valor.trim();
  if (!FORMATO_NUMERO_BRASILEIRO.test(normalizado)) return Number.NaN;

  const numero = Number(normalizado.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(numero) ? numero : Number.NaN;
}
