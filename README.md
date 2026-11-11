# API de Monitoramento de Sustentabilidade Industrial

Projeto acadêmico relacionado ao ODS 9. Registra consumo de energia (kWh), emissões de CO₂ (toneladas) e resíduos (kg) por empresa e mês. Implementação baseada na apresentação API DE MONITORAMENTO.

## Executar no VS Code

Requisito: Node.js 20 ou superior e npm. Extraia o ZIP e abra a pasta `api-monitoramento` no VS Code. Para usar o site, instale e inicie o frontend:

```powershell
Set-Location web
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

O login e o painel ficam em http://localhost:3001. O painel lê e grava os dados diretamente no Supabase, com a sessão da empresa e as políticas RLS; não é necessário iniciar a API NestJS para usar o site. Para executar ou testar também a API, abra outro terminal na pasta `api-monitoramento`, copie `.env.example` para `.env` e execute `npm install` e `npm run start:dev`; a API atende em http://localhost:3000.

Antes do primeiro uso:

1. No painel do Supabase, abra **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e execute-o. Isso cria as tabelas, valida o CNPJ e configura o isolamento dos dados por empresa.
2. Em **Authentication > URL Configuration**, adicione `http://localhost:3001/**` às URLs de redirecionamento permitidas.
3. Em **Authentication > Providers > Email**, desative **Confirm email** para que as empresas possam entrar sem confirmar o endereço. O projeto não verifica se mensagens de e-mail foram entregues.

A recuperação de senha continua solicitando ao Supabase o envio de um link por e-mail; a entrega depende das configurações do serviço de e-mail e não é verificada pela aplicação. Para testar esse fluxo, use a opção “Esqueceu a senha?” na tela de login.

O valor `sb_publishable_...` é uma chave pública, por isso é configurado como `SUPABASE_ANON_KEY` na API e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no Next.js; a segurança dos dados é aplicada pelas políticas RLS e pela autenticação, não por ocultar essa chave. O arquivo `.env.example` já seleciona `STORAGE_MODE=supabase`. Para testes locais sem conexão, altere para `STORAGE_MODE=memory`; esse modo mantém dados apenas em memória e não exige credenciais Supabase.

No Linux/macOS, use `cp .env.example .env` e `cp .env.local.example .env.local`. Para uma instalação reproduzível, use `npm ci` quando houver package-lock.json.

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

Reinicie a API. A coleção `registros` é criada ao inserir o primeiro documento. O SDK Admin usa as permissões IAM da conta de serviço. As credenciais devem permanecer fora do repositório. O modo Firestore mantém as rotas sem autenticação; somente `STORAGE_MODE=supabase` habilita a autenticação e o isolamento por empresa.

## Rotas

| Método | Rota | Resposta |
| --- | --- | --- |
| POST | /sustentabilidade | 201, registro criado |
| GET | /sustentabilidade/:empresaId | 200, histórico crescente por mês |
| GET | /sustentabilidade/:empresaId/indicadores | 200, comparação dos dois últimos meses registrados |
| GET | /sustentabilidade/:empresaId/:periodo | 200, registro de um mês; 404 se não existir |
| PUT | /sustentabilidade/:empresaId/:periodo | 200, substitui as três métricas |
| PATCH | /sustentabilidade/:empresaId/:periodo | 200, altera somente as métricas enviadas |
| DELETE | /sustentabilidade/:empresaId/:periodo | 204, exclui sem corpo de resposta |

Quando `STORAGE_MODE=supabase`, todas as rotas exigem `Authorization: Bearer <access_token>` e só permitem acesso ao UUID da empresa autenticada. O cadastro/login e a recuperação de senha são feitos pelo Supabase Auth no frontend.

Corpo do POST:

```json
{"empresaId":"empresa01","periodo":"2026-09","consumoEnergiaKwh":15000,"emissoesToneladasCO2":8.5,"residuosKg":1200}
```

Os valores são números finitos não negativos, limitados a Number.MAX_SAFE_INTEGER. O mês segue YYYY-MM. `empresaId` aceita até 100 letras, números, hífens e sublinhados. Campos desconhecidos são rejeitados. Cada empresa possui um registro por mês. Repetições retornam 409 e dados inválidos, 400. A listagem de uma empresa sem dados retorna []. Indicadores retornam 404 sem registros ou 422 com apenas um período.

## Cálculo

Variação (%) = ((atual - anterior) / anterior) × 100, arredondada para duas casas decimais. O exemplo da apresentação produz -10% de energia, -10,59% de CO₂ e -12,5% de resíduos. Se ambos os valores são zero, a variação é zero. Se o anterior é zero e o atual é positivo, a variação é `null`, pois a divisão não está definida. Meses não consecutivos são comparados como períodos registrados, sem estimar os meses ausentes. Reduções representam menor volume absoluto; os dados não incluem produção para calcular intensidade ou eficiência por unidade produzida.

## Estrutura

- `src/sustentabilidade/dto`: validação da entrada.
- `src/sustentabilidade`: controller, service, autenticação Supabase e repositórios em memória/Supabase.
- `src/firebase`: persistência no Firestore.
- `web`: frontend Next.js de login, cadastro, recuperação de senha, histórico e indicadores.
- `supabase/schema.sql`: tabelas, validação de CNPJ, trigger de cadastro e políticas RLS.
- `test`: regras de negócio e integração HTTP em memória.
- `postman`: collection com verificações automáticas.
- `docs`: testes e organização do GitHub.

## Validação

```powershell
npm test
npm run build
npm run test:cov
```

Para validar o frontend:

```powershell
Set-Location web
npm run typecheck
npm run build
```

No Postman, importe `postman/monitoramento.postman_collection.json`, configure `STORAGE_MODE=memory` e inicie a API; a collection usa identificadores de empresa de teste e não envia tokens. Cada execução cria uma empresa de teste exclusiva. As 12 requisições verificam cadastro, consultas, indicadores, substituição, alteração parcial, exclusão e erros esperados. A ordem importa: a exclusão ocorre após as consultas e atualizações. No modo Firestore, os registros de teste permanecem no banco. A collection foi criada para execução pelo usuário; veja `docs/VALIDACAO.md` para o que foi efetivamente executado neste pacote.

## Referências técnicas

- https://docs.nestjs.com/techniques/validation
- https://firebase.google.com/docs/admin/setup
- https://firebase.google.com/docs/firestore/quickstart


## Atualização e exclusão de registros

As rotas existentes continuam disponíveis. As novas rotas usam empresa e período
como identidade imutável do registro:

| Método | Rota | Comportamento |
| --- | --- | --- |
| PUT | /sustentabilidade/:empresaId/:periodo | Substitui todas as três métricas |
| PATCH | /sustentabilidade/:empresaId/:periodo | Atualiza apenas as métricas enviadas |
| DELETE | /sustentabilidade/:empresaId/:periodo | Exclui o registro e retorna 204 sem corpo |

Exemplo de URL: `http://localhost:3000/sustentabilidade/empresa01/2026-09`.

Corpo do PUT (todos os campos obrigatórios):

```json
{"consumoEnergiaKwh": 13000, "emissoesToneladasCO2": 7.2, "residuosKg": 1000}
```

Corpo do PATCH (pelo menos uma métrica):

```json
{"residuosKg": 900}
```

DELETE não recebe corpo. PUT e PATCH retornam 200 com o registro atualizado;
preservam id, empresaId, periodo e criadoEm e retornam atualizadoEm (data UTC no formato ISO 8601). Registro inexistente retorna 404.
Corpos vazios no PATCH, campos desconhecidos, valores nulos, negativos ou de tipo
incorreto retornam 400. Os indicadores refletem os registros atualizados e excluídos.
Para mudar empresa ou período, exclua o registro antigo e cadastre outro.
As operações estão implementadas em memória e no Firestore; no Firestore, atualização
e exclusão verificam a existência dentro de uma transação.

## Guia de uso das rotas

Veja `docs/ROTAS.md` para exemplos, códigos HTTP e localização do código.
O arquivo `requests.http`, na raiz, contém requisições para a extensão REST Client
(opcional) do VS Code. Também é possível testar com o Postman sem instalar essa extensão.
