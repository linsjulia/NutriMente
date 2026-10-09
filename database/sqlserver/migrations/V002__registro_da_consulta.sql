-- =============================================================
-- V002: registro da consulta (prontuário)
--
-- O que o profissional anota sobre cada atendimento. É obrigatório pelos
-- conselhos (CFP 01/2009 para psicólogos; CFN 594/2017 para nutricionistas)
-- e deve ser guardado por pelo menos 5 anos. Por isso:
--   - NÃO apaga em cascata: a exclusão de conta anonimiza a pessoa, mas o
--     registro fica (obrigação legal, LGPD art. 16, I);
--   - os textos são gravados CRIPTOGRAFADOS pela API (AES-GCM): quem abrir o
--     banco direto vê só um texto embaralhado. Por isso as colunas são
--     NVARCHAR(MAX), não um tamanho fixo.
--
-- Duas partes:
--   private_notes    -> evolução e anotações técnicas: SÓ o profissional lê
--   patient_guidance -> orientações combinadas: o paciente também lê
-- =============================================================

CREATE TABLE appointment_records (
    id                BIGINT IDENTITY(1,1) PRIMARY KEY,
    appointment_id    BIGINT         NOT NULL,
    professional_id   BIGINT         NOT NULL,
    private_notes     NVARCHAR(MAX)  NULL,
    patient_guidance  NVARCHAR(MAX)  NULL,
    created_at        DATETIME2(0)   NOT NULL CONSTRAINT df_appointment_records_created_at DEFAULT SYSUTCDATETIME(),
    updated_at        DATETIME2(0)   NOT NULL CONSTRAINT df_appointment_records_updated_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_appointment_records_appointment  FOREIGN KEY (appointment_id)  REFERENCES appointments (id),
    CONSTRAINT fk_appointment_records_professional FOREIGN KEY (professional_id) REFERENCES professionals (user_id),
    -- Um registro por consulta (editado, não duplicado)
    CONSTRAINT uq_appointment_records_appointment UNIQUE (appointment_id)
);
GO

CREATE INDEX ix_appointment_records_professional ON appointment_records (professional_id, updated_at DESC);
GO
