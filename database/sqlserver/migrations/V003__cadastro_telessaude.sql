-- =============================================================
-- V003: cadastro para atender online (e-Psi / e-Nutricionista)
--
-- Para atender por videochamada, o profissional precisa estar cadastrado
-- na plataforma do seu conselho:
--   - psicólogos: e-Psi (Resolução CFP 11/2018);
--   - nutricionistas: e-Nutricionista (Resolução CFN 666/2020).
-- O profissional DECLARA no perfil que tem o cadastro, e a API só aceita
-- consulta ONLINE com quem declarou. A data da declaração fica guardada
-- como registro de quando ele afirmou isso.
--
-- Padrão 0 (não declarado): ninguém passa a atender online sem declarar.
-- =============================================================

ALTER TABLE professionals ADD
    telehealth_registered   BIT           NOT NULL CONSTRAINT df_professionals_telehealth DEFAULT 0,
    telehealth_declared_at  DATETIME2(0)  NULL;
GO
