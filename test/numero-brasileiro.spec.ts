import {
  filtrarEntradaNumericaBrasileira,
  formatarNumeroBrasileiro,
  interpretarNumeroBrasileiro,
} from '../web/lib/numero-brasileiro';

describe('números no formato brasileiro', () => {
  it.each([
    ['1.500', 1500],
    ['1.500,50', 1500.5],
    ['1,5', 1.5],
    ['1500', 1500],
    ['0', 0],
  ])('interpreta %s como %s', (entrada, esperado) => {
    expect(interpretarNumeroBrasileiro(entrada)).toBe(esperado);
  });

  it.each(['1.5', '-1', '1,2,3', '1.50,25', 'abc', ''])(
    'rejeita formato inválido %s',
    entrada => expect(interpretarNumeroBrasileiro(entrada)).toBeNull(),
  );

  it('formata valores sem perder o agrupamento ou as casas decimais', () => {
    expect(formatarNumeroBrasileiro(1500)).toBe('1.500');
    expect(formatarNumeroBrasileiro(1500.5)).toBe('1.500,5');
  });

  it('não permite caracteres inválidos no campo', () => {
    expect(filtrarEntradaNumericaBrasileira('1.500,50')).toBe('1.500,50');
    expect(filtrarEntradaNumericaBrasileira('-1')).toBeNull();
    expect(filtrarEntradaNumericaBrasileira('1a500')).toBeNull();
  });
});
