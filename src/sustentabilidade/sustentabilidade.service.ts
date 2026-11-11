import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { UpdateRegistroDto } from './dto/update-registro.dto';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { RegistroRepository } from './registro.repository';
@Injectable()
export class SustentabilidadeService {
  constructor(private readonly repository: RegistroRepository) {}
  buscarPorPeriodo(empresaId: string, periodo: string, accessToken?: string) {
    return this.repository.buscar(empresaId, periodo, accessToken);
  }
  atualizar(empresaId: string, periodo: string, dto: UpdateRegistroDto, accessToken?: string) {
    const campos = Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== undefined));
    if (Object.keys(campos).length === 0) throw new BadRequestException('Informe pelo menos uma métrica');
    return this.repository.atualizar(empresaId, periodo, campos, accessToken);
  }
  excluir(empresaId: string, periodo: string, accessToken?: string) { return this.repository.excluir(empresaId, periodo, accessToken); }
  registrar(dto: CreateRegistroDto, accessToken?: string) { return this.repository.criar(dto, accessToken); }
  async listarPorEmpresa(empresaId: string, accessToken?: string) {
    const registros = await this.repository.listar(empresaId, accessToken);
    return registros.sort((a, b) => a.periodo.localeCompare(b.periodo));
  }
  calcularVariacaoPercentual(anterior: number, atual: number): number | null {
    if (anterior === 0) return atual === 0 ? 0 : null;
    return Math.round(((atual - anterior) / anterior) * 10000) / 100;
  }
  async calcularIndicadores(empresaId: string, accessToken?: string) {
    const registros = await this.listarPorEmpresa(empresaId, accessToken);
    if (registros.length === 0) throw new NotFoundException('Empresa sem registros');
    if (registros.length < 2) throw new UnprocessableEntityException('São necessários pelo menos dois períodos');
    const anterior = registros[registros.length - 2];
    const atual = registros[registros.length - 1];
    const indicador = (a: number, b: number) => ({ anterior: a, atual: b, variacaoPercentual: this.calcularVariacaoPercentual(a, b) });
    return {
      empresaId, periodoAnterior: anterior.periodo, periodoAtual: atual.periodo,
      consumoEnergiaKwh: indicador(anterior.consumoEnergiaKwh, atual.consumoEnergiaKwh),
      emissoesToneladasCO2: indicador(anterior.emissoesToneladasCO2, atual.emissoesToneladasCO2),
      residuosKg: indicador(anterior.residuosKg, atual.residuosKg),
    };
  }
}
