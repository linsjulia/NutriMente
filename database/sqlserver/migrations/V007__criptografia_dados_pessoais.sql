-- =============================================================
-- V007: CPF, telefone e data de nascimento criptografados
--
-- Esses três dados identificam a pessoa (LGPD, art. 5º, I) e passam a ser
-- gravados CRIPTOGRAFADOS pela API (AES-256-GCM, a mesma chave do
-- prontuário). Quem abrir o banco ou um backup vê só "v1:...".
--
-- O que muda no banco:
-- 1. As três colunas viram VARCHAR(200): o texto cifrado é maior que o
--    original, e a data deixa de ser DATE (o banco não "entende" mais a data;
--    quem entende é a API). Os valores atuais continuam lá, abertos, até a
--    API ligar: ao ligar, ela cifra os registros antigos (LegacyPersonalDataEncryptor).
-- 2. O CHECK do CPF (11 dígitos) sai: o banco não vê mais os dígitos. A
--    regra continua na API (@Cpf, com dígitos verificadores).
-- 3. CPF ÚNICO: texto cifrado não dá para comparar (o mesmo CPF gera um
--    texto diferente a cada gravação). Por isso existe cpf_hash, um
--    "índice cego": HMAC-SHA256 do CPF com uma chave secreta da API. O mesmo
--    CPF dá sempre o mesmo hash, e o índice único passa a ser nele.
--    Por que não um SHA-256 simples? Existem só ~1 bilhão de CPFs: daria para
--    calcular o hash de todos e descobrir o CPF. Com a chave secreta, não.
-- =============================================================

ALTER TABLE users DROP CONSTRAINT ck_users_cpf;
DROP INDEX uq_users_cpf ON users;
GO

ALTER TABLE users ALTER COLUMN cpf        VARCHAR(200) NULL;
ALTER TABLE users ALTER COLUMN telephone  VARCHAR(200) NULL;
-- DATE -> texto: os valores atuais viram 'AAAA-MM-DD' (a API entende os dois formatos)
ALTER TABLE users ALTER COLUMN birth_date VARCHAR(200) NULL;
GO

ALTER TABLE users ADD cpf_hash CHAR(64) NULL;   -- HMAC-SHA256 em hexadecimal
GO

CREATE UNIQUE INDEX uq_users_cpf_hash ON users (cpf_hash) WHERE cpf_hash IS NOT NULL;
GO
