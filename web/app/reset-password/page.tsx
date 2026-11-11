'use client';

import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ResetPassword() {
  const [pronto, setPronto] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setErro('O link de recuperação é inválido ou expirou.');
      else if (data.session) setPronto(true);
      else setErro('O link de recuperação é inválido ou expirou.');
    });
  }, []);

  async function redefinir(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dados = new FormData(event.currentTarget);
    const senha = String(dados.get('senha') ?? '');
    if (senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) setErro('Não foi possível alterar a senha. O link pode ter expirado; solicite uma nova recuperação.');
    else setMensagem('Senha alterada. Agora você pode entrar com a nova senha.');
  }

  return <main className="reset-page"><form className="auth-card" onSubmit={redefinir}>
    <p className="eyebrow">RECUPERAÇÃO DE ACESSO</p><h2>Defina uma nova senha</h2>
    <p className="subheading">Crie uma senha com pelo menos 8 caracteres.</p>
    <label>Nova senha<input name="senha" type="password" minLength={8} required disabled={!pronto} /></label>
    {erro && <p className="notice error" role="alert">{erro}</p>}
    {mensagem && <p className="notice success" role="status">{mensagem}</p>}
    <button className="primary-button" disabled={!pronto}>Salvar nova senha</button>
    <a className="back-link" href="/">Voltar ao login</a>
  </form></main>;
}
