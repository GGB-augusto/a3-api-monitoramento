export function traduzirErroAuth(erro: string): string {
  if (/invalid login credentials/i.test(erro)) {
    return 'E-mail ou senha incorretos. Se ainda não cadastrou a empresa, selecione “Cadastre-se”.';
  }
  if (/email not confirmed/i.test(erro)) {
    return 'Esta conta ainda aguarda confirmação. No Supabase, desative “Confirm email” e confirme este usuário em Authentication > Users.';
  }
  if (/failed to fetch|fetch failed|networkerror|load failed|network request failed/i.test(erro)) {
    return 'Não foi possível conectar ao Supabase. Confira sua conexão e as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em web/.env.local; depois reinicie o Next.js.';
  }
  if (/invalid api key|no api key found|api key is invalid/i.test(erro)) {
    return 'A chave pública do Supabase foi recusada. Confira NEXT_PUBLIC_SUPABASE_ANON_KEY em web/.env.local e reinicie o Next.js.';
  }
  if (/invalid.*url|url.*invalid|failed to parse url/i.test(erro)) {
    return 'A URL do Supabase é inválida. Confira NEXT_PUBLIC_SUPABASE_URL em web/.env.local e reinicie o Next.js.';
  }
  if (/user not found|email not found/i.test(erro)) {
    return 'Não há cadastro com esse e-mail. Selecione “Cadastre-se” para criar a conta da empresa.';
  }
  if (/email rate limit exceeded|rate limit/i.test(erro)) {
    return 'O limite de tentativas do Supabase foi atingido. Aguarde alguns minutos e tente novamente.';
  }
  if (/user already registered|already been registered/i.test(erro)) {
    return 'Este e-mail já possui cadastro. Tente entrar ou recuperar a senha.';
  }
  if (/duplicate key value violates unique constraint.*cnpj/i.test(erro)) {
    return 'Este CNPJ já possui cadastro.';
  }
  if (/database error saving new user/i.test(erro)) {
    return 'Não foi possível criar a conta. Confira se o script supabase/schema.sql foi executado e se o CNPJ já está cadastrado.';
  }
  if (/password should be|password is too short/i.test(erro)) {
    return 'A senha deve ter pelo menos 8 caracteres.';
  }
  return `O Supabase retornou um erro: ${erro}`;
}
