import { ConflictException, Injectable } from '@nestjs/common';
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
  async listar(empresaId: string) {
    return [...this.registros.values()].filter(r => r.empresaId === empresaId).map(r => ({ ...r }));
  }
}
