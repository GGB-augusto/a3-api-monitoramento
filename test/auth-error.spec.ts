import { traduzirErroAuth } from '../web/lib/auth-error';

describe('traduzirErroAuth', () => {
  it('informa quando o Supabase não pode ser alcançado', () => {
    expect(traduzirErroAuth('Failed to fetch')).toContain('Não foi possível conectar ao Supabase');
  });

  it('orienta a revisar a chave pública recusada', () => {
    expect(traduzirErroAuth('Invalid API key')).toContain('A chave pública do Supabase foi recusada');
  });

  it('explica credenciais incorretas em português', () => {
    expect(traduzirErroAuth('Invalid login credentials')).toContain('E-mail ou senha incorretos');
  });

  it('mantém o erro inesperado para facilitar o diagnóstico', () => {
    expect(traduzirErroAuth('Unexpected auth error')).toBe('O Supabase retornou um erro: Unexpected auth error');
  });
});
