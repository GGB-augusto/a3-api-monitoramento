export function traduzirErroBanco(erro: string, codigo?: string): string {
  if (codigo === '23505') {
    return 'Já existe um registro para esse período. Escolha outro mês ou edite o registro existente.';
  }
  if (codigo === '42P01' || codigo === 'PGRST205' || /could not find the table.*registros|relation .*registros.* does not exist/i.test(erro)) {
    return 'A tabela de indicadores ainda não foi criada. Execute o arquivo supabase/schema.sql no SQL Editor do seu projeto Supabase.';
  }
  if (codigo === '42501' || codigo === 'PGRST301' || /row-level security|permission denied|not allowed/i.test(erro)) {
    return 'O Supabase bloqueou o acesso ao registro. Confira se você está conectado com a conta da empresa e se as políticas do arquivo supabase/schema.sql foram aplicadas.';
  }
  if (codigo === '23503') {
    return 'O perfil da empresa não foi encontrado no Supabase. Confira o cadastro da empresa e execute o arquivo supabase/schema.sql.';
  }
  if (/failed to fetch|fetch failed|networkerror|load failed|network request failed/i.test(erro)) {
    return 'Não foi possível conectar ao Supabase. Verifique a conexão e as configurações em web/.env.local.';
  }
  return `Não foi possível acessar os indicadores no Supabase: ${erro}`;
}
