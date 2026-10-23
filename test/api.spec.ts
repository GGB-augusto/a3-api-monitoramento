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
  test.each([{periodo:'2026-13'}, {consumoEnergiaKwh:-1}, {residuosKg:'12'}, {empresaId:'../x'}, {extra:true}, {empresaId:''}])('rejeita entrada inválida %j', async (mudanca) => {
    await request(app.getHttpServer()).post('/sustentabilidade').send({ ...dado, ...mudanca }).expect(400);
  });
  test('respostas para duplicidade, empresa desconhecida e histórico insuficiente', async () => {
    await request(app.getHttpServer()).get('/sustentabilidade/ausente').expect(200, []);
    await request(app.getHttpServer()).get('/sustentabilidade/ausente/indicadores').expect(404);
    await request(app.getHttpServer()).post('/sustentabilidade').send(dado).expect(201);
    await request(app.getHttpServer()).post('/sustentabilidade').send(dado).expect(409);
    await request(app.getHttpServer()).get('/sustentabilidade/empresa01/indicadores').expect(422);
  });
});
