import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { UpdateRegistroDto } from './dto/update-registro.dto';
import { Registro, RegistroRepository } from './registro.repository';

interface RegistroRow {
  id: string;
  empresa_id: string;
  periodo: string;
  consumo_energia_kwh: number;
  emissoes_toneladas_co2: number;
  residuos_kg: number;
  criado_em: string;
  atualizado_em?: string | null;
}

@Injectable()
export class SupabaseRepository extends RegistroRepository {
  private readonly url: string;
  private readonly key: string;

  constructor() {
    super();
    this.url = process.env.SUPABASE_URL ?? '';
    this.key = process.env.SUPABASE_ANON_KEY ?? '';
    if (!this.url || !this.key) throw new Error('Configure SUPABASE_URL e SUPABASE_ANON_KEY');
  }

  async criar(dto: CreateRegistroDto, accessToken?: string): Promise<Registro> {
    const { data, error } = await this.client(accessToken)
      .from('registros')
      .insert({
        id: `${dto.empresaId}_${dto.periodo}`,
        empresa_id: dto.empresaId,
        periodo: dto.periodo,
        consumo_energia_kwh: dto.consumoEnergiaKwh,
        emissoes_toneladas_co2: dto.emissoesToneladasCO2,
        residuos_kg: dto.residuosKg,
      })
      .select()
      .single();
    if (error?.code === '23505') throw new ConflictException('Empresa já possui registro neste período');
    if (error) throw error;
    return this.toRegistro(data as RegistroRow);
  }

  async buscar(empresaId: string, periodo: string, accessToken?: string): Promise<Registro> {
    const { data, error } = await this.client(accessToken)
      .from('registros').select('*').eq('empresa_id', empresaId).eq('periodo', periodo).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Registro não encontrado');
    return this.toRegistro(data as RegistroRow);
  }

  async atualizar(empresaId: string, periodo: string, dto: UpdateRegistroDto, accessToken?: string): Promise<Registro> {
    const campos: Record<string, number | string> = {};
    if (dto.consumoEnergiaKwh !== undefined) campos.consumo_energia_kwh = dto.consumoEnergiaKwh;
    if (dto.emissoesToneladasCO2 !== undefined) campos.emissoes_toneladas_co2 = dto.emissoesToneladasCO2;
    if (dto.residuosKg !== undefined) campos.residuos_kg = dto.residuosKg;
    campos.atualizado_em = new Date().toISOString();
    const { data, error } = await this.client(accessToken)
      .from('registros').update(campos).eq('empresa_id', empresaId).eq('periodo', periodo).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Registro não encontrado');
    return this.toRegistro(data as RegistroRow);
  }

  async excluir(empresaId: string, periodo: string, accessToken?: string): Promise<void> {
    const { data, error } = await this.client(accessToken)
      .from('registros').delete().eq('empresa_id', empresaId).eq('periodo', periodo).select('id').maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Registro não encontrado');
  }

  async listar(empresaId: string, accessToken?: string): Promise<Registro[]> {
    const { data, error } = await this.client(accessToken)
      .from('registros').select('*').eq('empresa_id', empresaId).order('periodo');
    if (error) throw error;
    return data.map(row => this.toRegistro(row as RegistroRow));
  }

  private client(accessToken?: string): SupabaseClient {
    if (!accessToken) throw new UnauthorizedException('Token de acesso não informado');
    return createClient(this.url, this.key, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }

  private toRegistro(row: RegistroRow): Registro {
    return {
      id: row.id,
      empresaId: row.empresa_id,
      periodo: row.periodo,
      consumoEnergiaKwh: row.consumo_energia_kwh,
      emissoesToneladasCO2: row.emissoes_toneladas_co2,
      residuosKg: row.residuos_kg,
      criadoEm: row.criado_em,
      ...(row.atualizado_em ? { atualizadoEm: row.atualizado_em } : {}),
    };
  }
}
