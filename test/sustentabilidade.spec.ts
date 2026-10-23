import { SustentabilidadeService } from '../src/sustentabilidade/sustentabilidade.service';
import { MemoryRepository } from '../src/sustentabilidade/memory.repository';
const dado = { empresaId: 'empresa01', periodo: '2026-09', consumoEnergiaKwh: 15000, emissoesToneladasCO2: 8.5, residuosKg: 1200 };
describe('Regras de sustentabilidade', () => {
  let service: SustentabilidadeService;
  beforeEach(() => { service = new SustentabilidadeService(new MemoryRepository()); });
  test.each([[15000, 13500, -10], [8.5, 7.6, -10.59], [1200, 1050, -12.5], [0, 0, 0], [0, 10, null], [10, 0, -100], [100, 150, 50]])('variação de %s para %s', (a,b,c) => {
    expect(service.calcularVariacaoPercentual(a,b)).toBe(c);
  });
  test('ordena por período, isola empresas e compara os dois últimos meses', async () => {
    await service.registrar({ ...dado, periodo: '2026-10', consumoEnergiaKwh: 13500, emissoesToneladasCO2: 7.6, residuosKg: 1050 });
    await service.registrar({ ...dado, periodo: '2026-08' });
    await service.registrar(dado);
    await service.registrar({ ...dado, empresaId: 'outra' });
    expect((await service.listarPorEmpresa('empresa01')).map(r => r.periodo)).toEqual(['2026-08','2026-09','2026-10']);
    const indicadores = await service.calcularIndicadores('empresa01');
    expect(indicadores.periodoAnterior).toBe('2026-09');
    expect(indicadores.consumoEnergiaKwh.variacaoPercentual).toBe(-10);
  });
  test('rejeita duplicidade', async () => {
    await service.registrar(dado);
    await expect(service.registrar(dado)).rejects.toMatchObject({ status: 409 });
  });
  test('trata histórico vazio e insuficiente', async () => {
    await expect(service.calcularIndicadores('empresa01')).rejects.toMatchObject({ status: 404 });
    await service.registrar(dado);
    await expect(service.calcularIndicadores('empresa01')).rejects.toMatchObject({ status: 422 });
  });
});
