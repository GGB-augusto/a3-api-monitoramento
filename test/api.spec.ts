import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarValidacao } from '../src/validation';
const dado = { empresaId: 'empresa01', periodo: '2026-09', consumoEnergiaKwh: 15000, emissoesToneladasCO2: 8.5, residuosKg: 1200 };
describe('Endpoints HTTP', () => {
  let app: INestApplication;
  beforeEach(async () => {
    process.env.STORAGE_MODE = 'memory';
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication(); configurarValidacao(app); await app.init();
  });
  afterEach(async () => { await app.close(); });
  test('registra, lista e calcula indicadores', async () => {
    await request(app.getHttpServer()).post('/sustentabilidade').send(dado).expect(201);
    await request(app.getHttpServer()).post('/sustentabilidade').send({ ...dado, periodo: '2026-10', consumoEnergiaKwh: 13500, emissoesToneladasCO2: 7.6, residuosKg: 1050 }).expect(201);
    const historico = await request(app.getHttpServer()).get('/sustentabilidade/empresa01').expect(200);
    expect(historico.body).toHaveLength(2);
    const resposta = await request(app.getHttpServer()).get('/sustentabilidade/empresa01/indicadores').expect(200);
    expect(resposta.body.residuosKg.variacaoPercentual).toBe(-12.5);
    expect(resposta.body.emissoesToneladasCO2.variacaoPercentual).toBe(-10.59);
  });
  test.each([{periodo:'2026-13'}, {consumoEnergiaKwh:-1}, {residuosKg:'12abc'}, {empresaId:'../x'}, {extra:true}, {empresaId:''}])('rejeita entrada inválida %j', async (mudanca) => {
    await request(app.getHttpServer()).post('/sustentabilidade').send({ ...dado, ...mudanca }).expect(400);
  });
  test('converte valores no formato brasileiro antes de armazenar', async () => {
    const resposta = await request(app.getHttpServer()).post('/sustentabilidade').send({
      ...dado,
      periodo: '2026-11',
      consumoEnergiaKwh: '1.500',
      emissoesToneladasCO2: '1.500,50',
      residuosKg: '1,5',
    }).expect(201);
    expect(resposta.body).toMatchObject({
      consumoEnergiaKwh: 1500,
      emissoesToneladasCO2: 1500.5,
      residuosKg: 1.5,
    });

    const atualizado = await request(app.getHttpServer())
      .patch('/sustentabilidade/empresa01/2026-11')
      .send({ residuosKg: '2.345,75' })
      .expect(200);
    expect(atualizado.body.residuosKg).toBe(2345.75);
  });
  test('respostas para duplicidade, empresa desconhecida e histórico insuficiente', async () => {
    await request(app.getHttpServer()).get('/sustentabilidade/ausente').expect(200, []);
    await request(app.getHttpServer()).get('/sustentabilidade/ausente/indicadores').expect(404);
    await request(app.getHttpServer()).post('/sustentabilidade').send(dado).expect(201);
    await request(app.getHttpServer()).post('/sustentabilidade').send(dado).expect(409);
    await request(app.getHttpServer()).get('/sustentabilidade/empresa01/indicadores').expect(422);
  });

  test('PUT substitui métricas, PATCH preserva campos e DELETE remove o registro', async () => {
    const base = request(app.getHttpServer());
    await base.post('/sustentabilidade').send(dado).expect(201);
    const url = '/sustentabilidade/empresa01/2026-09';
    const completo = { consumoEnergiaKwh: 100, emissoesToneladasCO2: 2, residuosKg: 30 };
    const put = await base.put(url).send(completo).expect(200);
    expect(put.body).toMatchObject({ ...dado, ...completo });
    const patch = await base.patch(url).send({ residuosKg: 10 }).expect(200);
    expect(patch.body).toMatchObject({ ...completo, residuosKg: 10, criadoEm: put.body.criadoEm });
    expect(patch.body.atualizadoEm).toEqual(expect.any(String));
    await base.get(url).expect(200, patch.body);
    await base.delete(url).expect(204, '');
    await base.get(url).expect(404);
    await base.get('/sustentabilidade/empresa01').expect(200, []);
    await base.delete(url).expect(404);
    await base.patch(url).send({ residuosKg: 1 }).expect(404);
    await base.put(url).send(completo).expect(404);
  });
  test('novas rotas validam corpo, identidade e período', async () => {
    const base = request(app.getHttpServer());
    const url = '/sustentabilidade/empresa01/2026-09';
    await base.post('/sustentabilidade').send(dado).expect(201);
    await base.put(url).send({ residuosKg: 1 }).expect(400);
    for (const corpo of [{}, { residuosKg: null }, { residuosKg: -1 }, { residuosKg: '1abc' }, { empresaId: 'outra' }, { extra: true }]) {
      await base.patch(url).send(corpo).expect(400);
    }
    await base.delete('/sustentabilidade/empresa01/2026-13').expect(400);
    await base.patch('/sustentabilidade/invalido!/2026-09').send({ residuosKg: 1 }).expect(400);
    const lista = await base.get('/sustentabilidade/empresa01').expect(200);
    expect(lista.body[0]).toMatchObject(dado);
  });
  test('consulta por mês respeita empresa e mantém a rota de indicadores', async () => {
    const base = request(app.getHttpServer());
    await base.post('/sustentabilidade').send(dado).expect(201);
    await base.post('/sustentabilidade').send({ ...dado, periodo: '2026-10' }).expect(201);
    const registro = await base.get('/sustentabilidade/empresa01/2026-09').expect(200);
    expect(registro.body).toMatchObject(dado);
    await base.get('/sustentabilidade/outra/2026-09').expect(404);
    await base.get('/sustentabilidade/empresa01/2026-08').expect(404);
    await base.get('/sustentabilidade/empresa01/2026-13').expect(400);
    await base.get('/sustentabilidade/invalido!/2026-09').expect(400);
    await base.get('/sustentabilidade/empresa01/indicadores').expect(200);
  });

  test('alterações e exclusões são refletidas nos indicadores sem afetar outra empresa', async () => {
    const base = request(app.getHttpServer());
    await base.post('/sustentabilidade').send(dado).expect(201);
    await base.post('/sustentabilidade').send({ ...dado, periodo: '2026-10' }).expect(201);
    await base.post('/sustentabilidade').send({ ...dado, empresaId: 'outra' }).expect(201);
    await base.patch('/sustentabilidade/empresa01/2026-10').send({ consumoEnergiaKwh: 7500 }).expect(200);
    const indicadores = await base.get('/sustentabilidade/empresa01/indicadores').expect(200);
    expect(indicadores.body.consumoEnergiaKwh.variacaoPercentual).toBe(-50);
    const outra = await base.get('/sustentabilidade/outra/2026-09').expect(200);
    expect(outra.body.consumoEnergiaKwh).toBe(15000);
    await base.delete('/sustentabilidade/empresa01/2026-10').expect(204, '');
    await base.get('/sustentabilidade/empresa01/indicadores').expect(422);
  });

});
