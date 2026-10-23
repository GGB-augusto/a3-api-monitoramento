# Organização do repositório — semestre 2026/2

Use commits na data real de cada alteração. Os comandos abaixo são um roteiro, não um histórico de trabalho já realizado. O pacote não contém um repositório remoto nem commits atribuídos aos integrantes.

```powershell
git init -b main
git config user.name "SEU NOME"
git config user.email "SEU EMAIL"
git add .
git commit -m "feat: implementar API de sustentabilidade e testes"
git switch -c develop
```

Para próximas alterações, parta de `develop` e crie branches como `feature/registro`, `feature/indicadores` e `test/endpoints`. Faça os commits após concluir e validar as alterações reais. Abra pull requests para `develop` e integre a versão aprovada em `main`.

Crie um repositório vazio no GitHub e substitua a URL abaixo pela URL real:

```powershell
git remote add origin https://github.com/SEU_USUARIO/api-monitoramento.git
git push -u origin main
git push -u origin develop
```

Antes do push, execute `git status`, confira os arquivos staged e confirme que `.env`, chaves privadas e `node_modules` não estão incluídos. O push depende da sua conta e do acesso ao repositório.
