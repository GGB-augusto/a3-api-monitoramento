'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { validarCnpj } from '@/lib/cnpj';
import { traduzirErroAuth } from '@/lib/auth-error';
import { traduzirErroBanco } from '@/lib/database-error';
import { interpretarNumeroBrasileiro } from '@/lib/numero-brasileiro';
import { CampoNumericoBrasileiro } from '@/components/CampoNumericoBrasileiro';

type Registro = {
  id: string;
  empresaId: string;
  periodo: string;
  consumoEnergiaKwh: number;
  emissoesToneladasCO2: number;
  residuosKg: number;
};

type Indicador = {
  periodoAnterior: string;
  periodoAtual: string;
  consumoEnergiaKwh: { anterior: number; atual: number; variacaoPercentual: number | null };
  emissoesToneladasCO2: { anterior: number; atual: number; variacaoPercentual: number | null };
  residuosKg: { anterior: number; atual: number; variacaoPercentual: number | null };
};

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modo, setModo] = useState<'login' | 'cadastro' | 'recuperar'>('login');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [indicador, setIndicador] = useState<Indicador | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState<Registro | null>(null);
  const [versaoFormulario, setVersaoFormulario] = useState(0);

  const carregarDados = useCallback(async (sessao: Session) => {
    const { data, error } = await supabase
      .from('registros')
      .select('id, empresa_id, periodo, consumo_energia_kwh, emissoes_toneladas_co2, residuos_kg')
      .eq('empresa_id', sessao.user.id)
      .order('periodo');
    if (error) throw new Error(traduzirErroBanco(error.message, error.code));

    const historico: Registro[] = data.map(row => ({
      id: row.id,
      empresaId: row.empresa_id,
      periodo: row.periodo,
      consumoEnergiaKwh: row.consumo_energia_kwh,
      emissoesToneladasCO2: row.emissoes_toneladas_co2,
      residuosKg: row.residuos_kg,
    }));
    setRegistros(historico);
    if (historico.length < 2) {
      setIndicador(null);
      return;
    }

    const anterior = historico[historico.length - 2];
    const atual = historico[historico.length - 1];
    const calcularMetrica = (valorAnterior: number, valorAtual: number) => ({
      anterior: valorAnterior,
      atual: valorAtual,
      variacaoPercentual: valorAnterior === 0
        ? valorAtual === 0 ? 0 : null
        : Math.round(((valorAtual - valorAnterior) / valorAnterior) * 10000) / 100,
    });
    setIndicador({
      periodoAnterior: anterior.periodo,
      periodoAtual: atual.periodo,
      consumoEnergiaKwh: calcularMetrica(anterior.consumoEnergiaKwh, atual.consumoEnergiaKwh),
      emissoesToneladasCO2: calcularMetrica(anterior.emissoesToneladasCO2, atual.emissoesToneladasCO2),
      residuosKg: calcularMetrica(anterior.residuosKg, atual.residuosKg),
    });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) setErro(traduzirErroAuth(sessionError.message));
      setSession(data.session);
      setCarregando(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setCarregando(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setRegistros([]);
      setIndicador(null);
      return;
    }
    carregarDados(session).catch((error: Error) => setErro(error.message));
  }, [session, carregarDados]);

  async function enviarAcesso(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');
    setMensagem('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const senha = String(form.get('senha') ?? '');

    try {
      if (modo === 'recuperar') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw new Error(traduzirErroAuth(error.message));
        setMensagem('Solicitação processada. O Supabase enviará o link de recuperação para o endereço cadastrado.');
      } else if (modo === 'cadastro') {
        const nomeEmpresa = String(form.get('nomeEmpresa') ?? '').trim();
        const cnpj = String(form.get('cnpj') ?? '').replace(/\D/g, '');
        if (!nomeEmpresa) throw new Error('Informe a razão social ou nome da empresa.');
        if (!validarCnpj(cnpj)) throw new Error('Informe um CNPJ válido.');
        if (senha.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.');
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { data: { nomeEmpresa, cnpj } },
        });
        if (error) throw new Error(traduzirErroAuth(error.message));
        setMensagem(data.session
          ? 'Cadastro concluído. Sua empresa já pode acessar o painel.'
          : 'Cadastro realizado. Para entrar sem confirmação por e-mail, desative essa opção nas configurações do Supabase.');
        setModo('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw new Error(traduzirErroAuth(error.message));
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível concluir a solicitação.');
    }
  }

  async function salvarRegistro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const formElement = event.currentTarget;
    setErro('');
    setMensagem('');
    setSalvando(true);
    const form = new FormData(formElement);
    const periodo = String(form.get('periodo') ?? '');
    const energia = interpretarNumeroBrasileiro(String(form.get('energia') ?? ''));
    const co2 = interpretarNumeroBrasileiro(String(form.get('co2') ?? ''));
    const residuos = interpretarNumeroBrasileiro(String(form.get('residuos') ?? ''));
    const numeros = [
      ['Consumo de energia', energia],
      ['Emissões de CO₂', co2],
      ['Resíduos', residuos],
    ] as const;
    const numeroInvalido = numeros.find(([, numero]) =>
      numero === null || numero < 0 || numero > Number.MAX_SAFE_INTEGER
    );
    if (numeroInvalido) {
      setErro(`${numeroInvalido[0]} deve ser um número válido, maior ou igual a zero, no formato brasileiro (ex.: 1.500,50).`);
      setSalvando(false);
      return;
    }
    if (energia === null || co2 === null || residuos === null) {
      setErro('Informe valores numéricos válidos no formato brasileiro.');
      setSalvando(false);
      return;
    }
    const valores = {
      periodo,
      consumo_energia_kwh: energia,
      emissoes_toneladas_co2: co2,
      residuos_kg: residuos,
    };
    try {
      const resultado = editando
        ? await supabase.from('registros')
          .update({ ...valores, atualizado_em: new Date().toISOString() })
          .eq('id', editando.id)
          .eq('empresa_id', session.user.id)
          .select('id')
          .maybeSingle()
        : await supabase.from('registros')
          .insert({ ...valores, id: `${session.user.id}_${periodo}`, empresa_id: session.user.id })
          .select('id')
          .single();
      const { data, error } = resultado;
      if (error) throw new Error(traduzirErroBanco(error.message, error.code));
      if (!data) throw new Error('O registro não foi encontrado ou não pode ser alterado.');
      formElement.reset();
      const estavaEditando = Boolean(editando);
      setEditando(null);
      setVersaoFormulario(versao => versao + 1);
      await carregarDados(session);
      setMensagem(estavaEditando ? 'Registro atualizado com sucesso.' : 'Indicadores do período cadastrados.');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  }

  function iniciarEdicao(registro: Registro) {
    setErro('');
    setMensagem('');
    setEditando(registro);
  }

  function cancelarEdicao() {
    setEditando(null);
    setErro('');
  }

  async function excluirRegistro(registro: Registro) {
    if (!session || !window.confirm(`Deseja excluir os indicadores de ${registro.periodo}? Essa ação não pode ser desfeita.`)) return;
    setErro('');
    setMensagem('');
    try {
      const { data, error } = await supabase.from('registros')
        .delete()
        .eq('id', registro.id)
        .eq('empresa_id', session.user.id)
        .select('id')
        .maybeSingle();
      if (error) throw new Error(traduzirErroBanco(error.message, error.code));
      if (!data) throw new Error('O registro não foi encontrado ou não pode ser excluído.');
      if (editando?.id === registro.id) setEditando(null);
      await carregarDados(session);
      setMensagem(`Registro de ${registro.periodo} excluído.`);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível excluir o registro.');
    }
  }

  async function sair() {
    const { error } = await supabase.auth.signOut();
    if (error) setErro(error.message);
  }

  if (carregando) return <main className="loading">Carregando...</main>;
  if (!session) {
    return (
      <main className="auth-page">
        <section className="auth-aside">
          <a className="brand" href="/"><span className="brand-mark" aria-hidden="true">●</span><span>Eco<span className="brand-muted">Métrica</span></span></a>
          <div className="aside-copy">
            <p className="eyebrow">INDICADORES DE SUSTENTABILIDADE</p>
            <h1>Dados claros para um futuro melhor.</h1>
            <p>Acompanhe consumo de energia, emissões e resíduos da sua empresa em um só lugar.</p>
          </div>
          <p className="aside-foot">Plataforma de monitoramento empresarial</p>
        </section>
        <section className="auth-main">
          <form className="auth-card" onSubmit={enviarAcesso}>
            <p className="eyebrow">ÁREA DA EMPRESA</p>
            <h2>{modo === 'cadastro' ? 'Crie sua conta' : modo === 'recuperar' ? 'Recuperar senha' : 'Bem-vindo de volta'}</h2>
            <p className="subheading">
              {modo === 'cadastro' ? 'Cadastre sua empresa para começar a acompanhar os indicadores.' :
                modo === 'recuperar' ? 'Informe o e-mail da conta para receber o link de recuperação.' :
                  'Entre com os dados da sua empresa para acessar o painel.'}
            </p>
            {modo === 'cadastro' && <label>Nome da empresa<input name="nomeEmpresa" autoComplete="organization" required /></label>}
            {modo === 'cadastro' && <label>CNPJ<input name="cnpj" inputMode="numeric" placeholder="00.000.000/0000-00" maxLength={18} required /></label>}
            <label>E-mail<input name="email" type="email" autoComplete="email" required /></label>
            {modo !== 'recuperar' && <label>Senha<input name="senha" type="password" autoComplete={modo === 'cadastro' ? 'new-password' : 'current-password'} minLength={8} required /></label>}
            {erro && <p className="notice error" role="alert">{erro}</p>}
            {mensagem && <p className="notice success" role="status">{mensagem}</p>}
            <button className="primary-button" type="submit">{modo === 'cadastro' ? 'Cadastrar empresa' : modo === 'recuperar' ? 'Enviar link de recuperação' : 'Entrar'}</button>
            <div className="auth-links">
              {modo === 'login' && <button type="button" onClick={() => { setModo('recuperar'); setErro(''); setMensagem(''); }}>Esqueceu a senha?</button>}
              <button type="button" onClick={() => { setModo(modo === 'cadastro' ? 'login' : 'cadastro'); setErro(''); setMensagem(''); }}>
                {modo === 'cadastro' ? 'Já tem conta? Entrar' : 'Ainda não tem conta? Cadastre-se'}
              </button>
              {modo === 'recuperar' && <button type="button" onClick={() => setModo('login')}>Voltar para o login</button>}
            </div>
          </form>
        </section>
      </main>
    );
  }

  const nome = String(session.user.user_metadata.nomeEmpresa ?? 'Sua empresa');
  const email = session.user.email ?? '';
  return (
    <main className="dashboard">
      <header className="topbar">
        <a className="brand" href="/"><span className="brand-mark" aria-hidden="true">●</span><span>Eco<span className="brand-muted">Métrica</span></span></a>
        <div className="account"><div><strong>{nome}</strong><span>{email}</span></div><button className="secondary-button" onClick={sair}>Sair</button></div>
      </header>
      <section className="welcome">
        <p className="eyebrow">PAINEL DA EMPRESA</p>
        <h1>Seus indicadores, <span>em perspectiva.</span></h1>
        <p>Acompanhe seu histórico e registre os dados de cada período.</p>
      </section>
      <section className="content">
        {erro && <p className="notice error" role="alert">{erro}</p>}
        {mensagem && <p className="notice success" role="status">{mensagem}</p>}
        <div className="metrics">
          <Metric title="ENERGIA" value={indicador?.consumoEnergiaKwh.atual} unit="kWh" change={indicador?.consumoEnergiaKwh.variacaoPercentual} />
          <Metric title="EMISSÕES DE CO₂" value={indicador?.emissoesToneladasCO2.atual} unit="t" change={indicador?.emissoesToneladasCO2.variacaoPercentual} />
          <Metric title="RESÍDUOS" value={indicador?.residuosKg.atual} unit="kg" change={indicador?.residuosKg.variacaoPercentual} />
        </div>
        <div className="dashboard-grid">
          <section className="panel">
            <div className="panel-title"><div><p className="eyebrow">DADOS REGISTRADOS</p><h2>Histórico mensal</h2></div><span className="count">{registros.length} períodos</span></div>
            {registros.length ? (
              <div className="table-wrap"><table><thead><tr><th>Período</th><th>Energia (kWh)</th><th>CO₂ (t)</th><th>Resíduos (kg)</th><th>Ações</th></tr></thead>
                <tbody>{[...registros].reverse().map(registro => <tr key={registro.id}>
                  <td>{registro.periodo}</td><td>{formatar(registro.consumoEnergiaKwh)}</td><td>{formatar(registro.emissoesToneladasCO2)}</td><td>{formatar(registro.residuosKg)}</td>
                  <td><div className="record-actions">
                    <button type="button" className="text-button" onClick={() => iniciarEdicao(registro)} aria-label={`Editar ${registro.periodo}`}>Editar</button>
                    <button type="button" className="text-button delete-button" onClick={() => excluirRegistro(registro)} aria-label={`Excluir ${registro.periodo}`}>Excluir</button>
                  </div></td>
                </tr>)}</tbody>
              </table></div>
            ) : <p className="empty">Ainda não há registros. Cadastre o primeiro período ao lado.</p>}
          </section>
          <section className="panel add-panel">
            <p className="eyebrow">{editando ? 'ALTERAR PERÍODO' : 'NOVO PERÍODO'}</p><h2>{editando ? 'Editar indicadores' : 'Registrar indicadores'}</h2>
            <form className="record-form" key={`${editando?.id ?? 'novo-registro'}-${versaoFormulario}`} onSubmit={salvarRegistro}>
              <label>Período<input type="month" name="periodo" defaultValue={editando?.periodo} required /></label>
              <CampoNumericoBrasileiro name="energia" label="Consumo de energia" unidade="kWh" valor={editando?.consumoEnergiaKwh} />
              <CampoNumericoBrasileiro name="co2" label="Emissões de CO₂" unidade="t" valor={editando?.emissoesToneladasCO2} />
              <CampoNumericoBrasileiro name="residuos" label="Resíduos" unidade="kg" valor={editando?.residuosKg} />
              <button className="primary-button" disabled={salvando}>{salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Salvar período'}</button>
              {editando && <button className="secondary-button cancel-edit" type="button" onClick={cancelarEdicao}>Cancelar edição</button>}
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

function Metric({ title, value, unit, change }: { title: string; value?: number; unit: string; change?: number | null }) {
  return <article className="metric"><p className="eyebrow">{title}</p><strong>{value === undefined ? '—' : formatar(value)} <small>{value === undefined ? '' : unit}</small></strong>
    <span className="change">{change === undefined ? 'Necessário registrar dois períodos' : change === null ? 'Variação indisponível' : `${change > 0 ? '+' : ''}${formatar(change)}% vs. período anterior`}</span></article>;
}

function formatar(valor: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 20 }).format(valor);
}
