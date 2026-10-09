-- =============================================================
-- V004: encerrar as sessões abertas quando a senha muda
--
-- O login devolve um token (JWT) que vale por 8 horas, e a API não guarda
-- os tokens. Por isso, sem esta coluna, quem trocava a senha (por exemplo,
-- porque alguém a descobriu) continuava com as sessões antigas valendo.
--
-- session_version é um contador. O número vai dentro do token, e a API
-- confere a cada requisição: se o token tem um número menor que o do banco,
-- ele é recusado. Trocar ou redefinir a senha soma 1, e todas as sessões
-- antigas caem de uma vez (em todos os aparelhos).
--
-- Padrão 0: tokens emitidos antes desta migração não têm o número e contam
-- como 0, então continuam valendo até a primeira troca de senha.
-- =============================================================

ALTER TABLE users ADD
    session_version  INT  NOT NULL CONSTRAINT df_users_session_version DEFAULT 0;
GO
