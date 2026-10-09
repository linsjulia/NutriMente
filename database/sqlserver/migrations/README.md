# Migrações do banco (SQL Server)

Mudanças no banco feitas **depois** da primeira versão (`scripts/01-03`). Elas atualizam um banco que já existe **sem apagar os dados**.

## Como funciona

Toda vez que o contêiner do SQL Server liga (`entrypoint.sh`):

1. Se o banco não existe, roda `scripts/01-03` (primeira vez).
2. Roda, em ordem, cada arquivo `migrations/V*.sql` que **ainda não** está na tabela `schema_migrations`, e registra o arquivo nela.
3. Só então o banco fica "healthy", e a API liga.

Para receber migrações novas depois de um `git pull`:

```bash
docker compose up -d --build sqlserver api
```

Não precisa de `docker compose down -v`: os dados continuam lá.

## Criando uma migração

1. Crie `migrations/V003__descricao_curta.sql`, com o próximo número e **3 dígitos**: `V010` vem depois de `V009` em ordem alfabética.
2. Escreva o SQL (CREATE TABLE, ALTER TABLE...) com comentários explicando o porquê. Separe os lotes com `GO`.
3. **Nunca edite uma migração que já foi enviada:** quem já aplicou não vai rodar de novo. Para corrigir, crie uma nova.
4. Adicione um teste em `database/tests/sqlserver.test.js`.
5. Rode `docker compose up -d --build sqlserver` e confira no log: `docker compose logs sqlserver | grep migração`.

O usuário da aplicação já tem leitura e escrita em tabelas novas (`db_datareader`/`db_datawriter`), mas **não** pode alterar a estrutura: só as migrações, rodando como administrador, podem.

## Histórico

| Versão | O que faz |
|---|---|
| `V002` | Registro da consulta (prontuário): tabela `appointment_records` |
| `V003` | Cadastro para atender online (e-Psi / e-Nutricionista): colunas `telehealth_*` em `professionals` |
