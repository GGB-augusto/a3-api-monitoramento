import { validarCnpj } from '../web/lib/cnpj';

describe('validarCnpj', () => {
  it('accepts a valid CNPJ with or without punctuation', () => {
    expect(validarCnpj('12.345.678/0001-95')).toBe(true);
    expect(validarCnpj('12345678000195')).toBe(true);
  });

  it.each(['11111111111111', '12.345.678/0001-96', '123', 'abcdefghijklmn'])(
    'rejects invalid CNPJ %s',
    (cnpj) => expect(validarCnpj(cnpj)).toBe(false),
  );
});
