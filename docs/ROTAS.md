# Guia das rotas

Base local: `http://localhost:3000`. O termo correto é PATCH.

## Onde encontrar no VS Code

| Arquivo | Responsabilidade |
| --- | --- |
| src/sustentabilidade/sustentabilidade.controller.ts | Métodos HTTP, URLs e códigos de sucesso |
| src/sustentabilidade/sustentabilidade.service.ts | Regras de negócio e indicadores |
| src/sustentabilidade/dto/registro-params.dto.ts | Validação de empresa e mês na URL |
| src/sustentabilidade/dto/update-registro.dto.ts | Campos exigidos no PUT e opcionais no PATCH |
| src/sustentabilidade/memory.repository.ts | Dados temporários em memória |
| src/firebase/firestore.repository.ts | Dados persistidos no Firestore |
| postman/monitoramento.postman_collection.json | Requisições e verificações no Postman |
| requests.http | Exemplos executáveis no VS Code com REST Client |

## Sequência para testar

1. Inicie a API conforme o README.
2. Faça POST para cadastrar um registro.
3. Consulte o registro com GET.
4. Faça PUT com todas as métricas.
5. Faça PATCH com uma ou mais métricas.
6. Consulte novamente para conferir o resultado.
7. Faça DELETE e confira que GET passa a retornar 404.

Use a URL `/sustentabilidade/empresa01/2026-09` nos passos 3 a 7.

### POST /sustentabilidade

Cria um registro. Retorna 201; duplicidade de empresa e mês retorna 409.

```json
{
  "empresaId": "empresa01",
  "periodo": "2026-09",
  "consumoEnergiaKwh": 15000,
  "emissoesToneladasCO2": 8.5,
  "residuosKg": 1200
}
```

### PUT /sustentabilidade/:empresaId/:periodo

Substitui todas as métricas de um registro existente. Retorna 200.
As três métricas são obrigatórias, mesmo que alguma tenha valor zero.
Um campo ausente retorna 400. Um registro inexistente retorna 404;
esta API não cadastra registros pelo PUT.

```json
{
  "consumoEnergiaKwh": 13000,
  "emissoesToneladasCO2": 7.2,
  "residuosKg": 1000
}
```

### PATCH /sustentabilidade/:empresaId/:periodo

Altera apenas as métricas enviadas. Retorna 200 e preserva as demais.
Um corpo vazio retorna 400. Zero é permitido; null não é permitido.

```json
{ "residuosKg": 900 }
```

PUT e PATCH preservam `id`, `empresaId`, `periodo` e `criadoEm`.
O campo `atualizadoEm` informa o horário UTC da última alteração.
Registros antigos podem não ter esse campo até a primeira alteração.
Para mudar empresa ou mês, cadastre um novo registro e exclua o antigo.

### GET /sustentabilidade/:empresaId/:periodo

Retorna 200 com o registro completo, inclusive os valores atuais após PUT/PATCH.
Retorna 404 se ele não existir. A consulta é isolada por empresa.

### DELETE /sustentabilidade/:empresaId/:periodo

Não recebe corpo. Retorna 204 sem JSON. Retorna 404 se o registro já não existir.
A exclusão é definitiva. No modo memória todos os dados também são perdidos ao reiniciar.

### Consultas de histórico e indicadores

- `GET /sustentabilidade/:empresaId`: histórico ordenado por mês; sem dados retorna `[]`.
- `GET /sustentabilidade/:empresaId/indicadores`: compara os dois últimos meses registrados.
  Sem registros retorna 404; com apenas um, 422. PUT, PATCH e DELETE afetam os cálculos seguintes.

## Validação e erros

| Código | Significado | Ação |
| --- | --- | --- |
| 400 | Corpo ou parâmetros inválidos | Verifique os campos e use mês YYYY-MM |
| 404 | Registro inexistente ou empresa sem indicadores | Cadastre ou confira empresa e mês |
| 409 | Registro duplicado | Use PUT/PATCH para alterar o existente |
| 422 | Histórico insuficiente para indicadores | Cadastre pelo menos dois meses |

Métricas devem ser números finitos entre zero e Number.MAX_SAFE_INTEGER.
Strings numéricas, valores negativos, null e campos desconhecidos são rejeitados.
`empresaId` aceita de 1 a 100 letras, números, hífens ou sublinhados.

A API atende localmente e não possui autenticação. A execução em memória é destinada
a desenvolvimento e demonstração. Testes automatizados locais não comprovam a conexão com Firebase.
