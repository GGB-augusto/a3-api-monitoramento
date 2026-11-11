import { traduzirErroBanco } from '../web/lib/database-error';

describe('traduzirErroBanco', () => {
  it('orienta a criar a tabela quando o schema ainda não foi aplicado', () => {
    expect(traduzirErroBanco('relation "registros" does not exist', '42P01')).toContain('Execute o arquivo supabase/schema.sql');
  });

  it('explica a duplicidade do período', () => {
    expect(traduzirErroBanco('duplicate key', '23505')).toContain('Já existe um registro para esse período');
  });

  it('orienta sobre as políticas de acesso do Supabase', () => {
    expect(traduzirErroBanco('row-level security policy', '42501')).toContain('políticas do arquivo supabase/schema.sql');
  });
});
