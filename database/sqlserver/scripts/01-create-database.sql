-- =============================================================
-- NutriMente - Criação do banco e do usuário da aplicação
--
-- Variáveis do sqlcmd: $(APP_USER) e $(APP_PASSWORD) são substituídas
-- pelos valores do arquivo .env (ver entrypoint.sh). Assim nenhuma senha
-- fica escrita no código.
-- =============================================================

-- COLLATE define como o banco compara e ordena textos:
--   CI  = Case Insensitive   -> "ANA" = "ana"
--   AI  = Accent Insensitive -> "psicologo" encontra "psicólogo"
--   UTF8/SC = suporte completo a caracteres Unicode (inclusive emoji)
-- Ótimo para busca por nome em português.
IF DB_ID(N'NutriMente') IS NULL
BEGIN
    CREATE DATABASE NutriMente COLLATE Latin1_General_100_CI_AI_SC_UTF8;
END
GO

-- No SQL Server existem dois níveis:
--   LOGIN = credencial para entrar no SERVIDOR (usuário + senha).
--   USER  = permissão dentro de UM banco específico, ligado ao login.
-- A API Java NÃO deve usar o "sa" (administrador total): se a API for
-- invadida, o estrago fica limitado ao que este usuário pode fazer.
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'$(APP_USER)')
BEGIN
    -- CHECK_POLICY = ON exige senha forte
    CREATE LOGIN [$(APP_USER)] WITH PASSWORD = N'$(APP_PASSWORD)', DEFAULT_DATABASE = NutriMente, CHECK_POLICY = ON;
END
GO

USE NutriMente;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'$(APP_USER)')
BEGIN
    CREATE USER [$(APP_USER)] FOR LOGIN [$(APP_USER)];
    -- Princípio do menor privilégio: a aplicação pode ler (SELECT) e gravar
    -- (INSERT/UPDATE/DELETE) dados, mas NÃO pode criar/apagar tabelas.
    -- Mudanças de estrutura são feitas por scripts, com o usuário "sa".
    ALTER ROLE db_datareader ADD MEMBER [$(APP_USER)];
    ALTER ROLE db_datawriter ADD MEMBER [$(APP_USER)];
    -- Permite executar procedures/functions, caso sejam criadas no futuro
    GRANT EXECUTE TO [$(APP_USER)];
END
GO
