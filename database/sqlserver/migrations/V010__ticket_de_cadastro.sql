-- =============================================================
-- V010: "ticket de cadastro" (entrar sozinho depois de confirmar o e-mail)
--
-- Quem se cadastra no computador e confirma o e-mail no celular ficava com
-- a tela do computador parada em "Confirme seu e-mail" e precisava digitar
-- e-mail e senha de novo. Agora o cadastro devolve um ticket, guardado num
-- cookie só daquele navegador; a tela pergunta de tempos em tempos se o
-- e-mail já foi confirmado e, quando foi, troca o ticket por uma sessão.
--
-- O ticket vai na mesma tabela dos links de e-mail (user_tokens: só o hash,
-- validade, uso único). Aqui só liberamos o novo tipo na regra da coluna.
-- =============================================================

ALTER TABLE user_tokens DROP CONSTRAINT ck_user_tokens_purpose;
GO

ALTER TABLE user_tokens ADD CONSTRAINT ck_user_tokens_purpose
    CHECK (purpose IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'REGISTRATION'));
GO
