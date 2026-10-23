import { CreateRegistroDto } from './dto/create-registro.dto';
export interface Registro extends CreateRegistroDto { id: string; criadoEm: string; }
export abstract class RegistroRepository {
  abstract criar(dto: CreateRegistroDto): Promise<Registro>;
  abstract listar(empresaId: string): Promise<Registro[]>;
}
