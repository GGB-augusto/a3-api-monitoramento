import { UpdateRegistroDto } from './dto/update-registro.dto';
import { CreateRegistroDto } from './dto/create-registro.dto';
export interface Registro extends CreateRegistroDto { id: string; criadoEm: string; atualizadoEm?: string; }
export abstract class RegistroRepository {
  abstract buscar(empresaId: string, periodo: string, accessToken?: string): Promise<Registro>;
  abstract atualizar(empresaId: string, periodo: string, dto: UpdateRegistroDto, accessToken?: string): Promise<Registro>;
  abstract excluir(empresaId: string, periodo: string, accessToken?: string): Promise<void>;
  abstract criar(dto: CreateRegistroDto, accessToken?: string): Promise<Registro>;
  abstract listar(empresaId: string, accessToken?: string): Promise<Registro[]>;
}
