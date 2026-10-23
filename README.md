# API de Monitoramento de Sustentabilidade Industrial

Projeto acadêmico relacionado ao ODS 9. Registra consumo de energia (kWh), emissões de CO₂ (toneladas) e resíduos (kg) por empresa e mês. Implementação baseada na apresentação API DE MONITORAMENTO.

## Executar no VS Code

Requisito: Node.js 20 ou superior e npm. Extraia o ZIP e abra a pasta `api-monitoramento` no VS Code. No terminal:

```powershell
npm install
Copy-Item .env.example .env
npm run start:dev
```

No Linux/macOS, substitua `Copy-Item .env.example .env` por `cp .env.example .env`. A API atende em http://localhost:3000. O modo padrão `memory` dispensa credenciais e perde os dados ao reiniciar. Para uma instalação reproduzível, use `npm ci` quando houver package-lock.json.

## Firestore

1. Crie um projeto no Firebase e ative o banco Cloud Firestore.
2. Em Configurações do projeto > Contas de serviço, gere a chave privada e guarde o JSON em `credentials/service-account.json`.
3. No `.env`, configure:

```dotenv
PORT=3000
STORAGE_MODE=firestore
FIREBASE_PROJECT_ID=seu-projeto
GOOGLE_APPLICATION_CREDENTIALS=./credentials/service-account.json
```

Reinicie a API. A coleção `registros` é criada ao inserir o primeiro documento. O SDK Admin usa as permissões IAM da conta de serviço. As credenciais devem permanecer fora do repositório. A aplicação acadêmica não implementa autenticação dos clientes e atende somente na interface local. A integração real exige credenciais válidas e não faz parte dos testes locais em memória.

## Rotas

| Método | Rota | Resposta |
| --- | --- | --- |
| POST | /sustentabilidade | 201, registro criado |
| GET | /sustentabilidade/:empresaId | 200, histórico crescente por mês |
| GET | /sustentabilidade/:empresaId/indicadores | 200, comparação dos dois últimos meses registrados |

Corpo do POST:

```json
{"empresaId":"empresa01","periodo":"2026-09","consumoEnergiaKwh":15000,"emissoesToneladasCO2":8.5,"residuosKg":1200}
```

Os valores são números finitos não negativos, limitados a Number.MAX_SAFE_INTEGER. O mês segue YYYY-MM. `empresaId` aceita até 100 letras, números, hífens e sublinhados. Campos desconhecidos são rejeitados. Cada empresa possui um registro por mês. Repetições retornam 409 e dados inválidos, 400. A listagem de uma empresa sem dados retorna []. Indicadores retornam 404 sem registros ou 422 com apenas um período.

## Cálculo

Variação (%) = ((atual - anterior) / anterior) × 100, arredondada para duas casas decimais. O exemplo da apresentação produz -10% de energia, -10,59% de CO₂ e -12,5% de resíduos. Se ambos os valores são zero, a variação é zero. Se o anterior é zero e o atual é positivo, a variação é `null`, pois a divisão não está definida. Meses não consecutivos são comparados como períodos registrados, sem estimar os meses ausentes. Reduções representam menor volume absoluto; os dados não incluem produção para calcular intensidade ou eficiência por unidade produzida.

## Estrutura

- `src/sustentabilidade/dto`: validação da entrada.
- `src/sustentabilidade`: controller, service e repositório em memória.
- `src/firebase`: persistência no Firestore.
- `test`: regras de negócio e integração HTTP em memória.
- `postman`: collection com verificações automáticas.
- `docs`: testes e organização do GitHub.

## Validação

```powershell
npm test
npm run build
npm run test:cov
```

No Postman, importe `postman/monitoramento.postman_collection.json`, inicie a API e execute a collection inteira na ordem pelo Runner. Cada execução cria uma empresa de teste exclusiva. As seis requisições verificam as três rotas e os erros de duplicidade e mês inválido. No modo Firestore, os registros de teste permanecem no banco. A collection foi criada para execução pelo usuário; veja `docs/VALIDACAO.md` para o que foi efetivamente executado neste pacote.

## Referências técnicas

- https://docs.nestjs.com/techniques/validation
- https://firebase.google.com/docs/admin/setup
- https://firebase.google.com/docs/firestore/quickstart
