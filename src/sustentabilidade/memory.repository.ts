import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateRegistroDto } from './dto/update-registro.dto';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { Registro, RegistroRepository } from './registro.repository';
@Injectable()
export class MemoryRepository extends RegistroRepository {
  private registros = new Map<string, Registro>();
  async criar(dto: CreateRegistroDto) {
    const id = `${dto.empresaId}_${dto.periodo}`;
    if (this.registros.has(id)) throw new ConflictException('Empresa já possui registro neste período');
    const registro = { ...dto, id, criadoEm: new Date().toISOString() };
    this.registros.set(id, registro);
    return { ...registro };
  }
  async buscar(empresaId: string, periodo: string) {
    const registro = this.registros.get(`${empresaId}_${periodo}`);
    if (!registro) throw new NotFoundException('Registro não encontrado');
    return { ...registro };
  }
  async atualizar(empresaId: string, periodo: string, dto: UpdateRegistroDto) {
    const id = `${empresaId}_${periodo}`;
    const atual = this.registros.get(id);
    if (!atual) throw new NotFoundException('Registro não encontrado');
    const registro = { ...atual, ...dto, atualizadoEm: new Date().toISOString() };
    this.registros.set(id, registro);
    return { ...registro };
  }
  async excluir(empresaId: string, periodo: string) {
    if (!this.registros.delete(`${empresaId}_${periodo}`)) throw new NotFoundException('Registro não encontrado');
  }
  async listar(empresaId: string) {
    return [...this.registros.values()].filter(r => r.empresaId === empresaId).map(r => ({ ...r }));
  }
}
