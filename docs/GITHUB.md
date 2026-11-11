# Organização do repositório — semestre 2026/2

Repositório oficial: https://github.com/GGB-augusto/a3-api-monitoramento (branch `main`).

## Enviar uma nova alteração

```cmd
git clone https://github.com/GGB-augusto/a3-api-monitoramento.git
cd a3-api-monitoramento
git switch -c feature/nome-da-alteracao
```

Faça as alterações, valide com `npm test` e `npm run build` e envie:

```cmd
git add -A
git status
git commit -m "tipo: descrição curta da alteração"
git push -u origin feature/nome-da-alteracao
```

Abra um pull request para `main` no GitHub e integre após a revisão de outro integrante.

## Cuidados antes do push

Confira no `git status` que `.env`, `web/.env.local`, chaves privadas, `node_modules`,
`.next` e `dist` não estão na lista. O `.gitignore` já exclui esses itens.
