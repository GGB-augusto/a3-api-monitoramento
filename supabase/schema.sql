create table if not exists public.empresas (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  cnpj char(14) not null unique,
  email text not null,
  criado_em timestamptz not null default now()
);

create table if not exists public.registros (
  id text primary key,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  periodo text not null check (periodo ~ '^[1-9][0-9]{3}-(0[1-9]|1[0-2])$'),
  consumo_energia_kwh double precision not null check (consumo_energia_kwh >= 0),
  emissoes_toneladas_co2 double precision not null check (emissoes_toneladas_co2 >= 0),
  residuos_kg double precision not null check (residuos_kg >= 0),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz,
  unique (empresa_id, periodo)
);

create or replace function public.cnpj_valido(valor text)
returns boolean
language plpgsql
immutable
as $$
declare
  numeros text := regexp_replace(coalesce(valor, ''), '\D', '', 'g');
  pesos1 integer[] := array[5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  pesos2 integer[] := array[6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  soma integer := 0;
  resto integer;
  primeiro integer;
  segundo integer;
  i integer;
begin
  if length(numeros) <> 14 or numeros = repeat(substr(numeros, 1, 1), 14) then
    return false;
  end if;
  for i in 1..12 loop
    soma := soma + substr(numeros, i, 1)::integer * pesos1[i];
  end loop;
  resto := soma % 11;
  primeiro := case when resto < 2 then 0 else 11 - resto end;
  if primeiro <> substr(numeros, 13, 1)::integer then
    return false;
  end if;
  soma := 0;
  for i in 1..13 loop
    soma := soma + substr(numeros, i, 1)::integer * pesos2[i];
  end loop;
  resto := soma % 11;
  segundo := case when resto < 2 then 0 else 11 - resto end;
  return segundo = substr(numeros, 14, 1)::integer;
end;
$$;

create or replace function public.criar_empresa_do_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  dados jsonb := new.raw_user_meta_data;
  cnpj_normalizado text := regexp_replace(coalesce(dados ->> 'cnpj', ''), '\D', '', 'g');
begin
  if not public.cnpj_valido(cnpj_normalizado) then
    raise exception 'CNPJ inválido';
  end if;
  insert into public.empresas (id, nome, cnpj, email)
  values (new.id, trim(coalesce(dados ->> 'nomeEmpresa', '')), cnpj_normalizado, new.email);
  return new;
end;
$$;

drop trigger if exists criar_empresa_apos_cadastro on auth.users;
create trigger criar_empresa_apos_cadastro
after insert on auth.users
for each row execute function public.criar_empresa_do_usuario();

alter table public.empresas enable row level security;
alter table public.registros enable row level security;

drop policy if exists "empresa consulta o proprio perfil" on public.empresas;
create policy "empresa consulta o proprio perfil"
on public.empresas for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "empresa gerencia os proprios registros" on public.registros;
create policy "empresa gerencia os proprios registros"
on public.registros for all to authenticated
using ((select auth.uid()) = empresa_id)
with check ((select auth.uid()) = empresa_id);

grant select on public.empresas to authenticated;
grant select, insert, update, delete on public.registros to authenticated;
