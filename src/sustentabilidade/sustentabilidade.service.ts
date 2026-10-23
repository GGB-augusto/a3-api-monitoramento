import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { RegistroRepository } from './registro.repository';
@Injectable()
export class SustentabilidadeService {
  constructor(private readonly repository: RegistroRepository) {}
  registrar(dto: CreateRegistroDto) { return this.repository.criar(dto); }
  async listarPorEmpresa(empresaId: string) {
    const registros = await this.repository.listar(empresaId);
    return registros.sort((a, b) => a.periodo.localeCompare(b.periodo));
  }
  calcularVariacaoPercentual(anterior: number, atual: number): number | null {
    if (anterior === 0) return atual === 0 ? 0 : null;
    return Math.round(((atual - anterior) / anterior) * 10000) / 100;
  }
  async calcularIndicadores(empresaId: string) {
    const registros = await this.listarPorEmpresa(empresaId);
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
