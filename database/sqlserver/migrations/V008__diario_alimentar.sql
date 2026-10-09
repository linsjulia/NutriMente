-- =============================================================
-- V008: diário alimentar (registro de refeições, fotos e anotações)
--
-- O paciente registra o que comeu (com foto opcional) e como se sentiu;
-- o profissional que o atende acompanha. É o card "Registro de refeições,
-- fotos e anotações do cliente para enviar ao profissional".
--
-- Dado de saúde (LGPD, art. 11):
-- - descrição e anotações são gravadas CRIPTOGRAFADAS pela API (AES-GCM);
-- - a FOTO não fica no banco: vai para uma pasta da API (volume do Docker),
--   também criptografada, com nome aleatório. Aqui fica só o nome do
--   arquivo e o tipo da imagem;
-- - diferente do prontuário, o diário é do paciente: se ele excluir a
--   conta, o diário e as fotos são APAGADOS (não há obrigação de guarda).
-- =============================================================

CREATE TABLE meal_logs (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    patient_id          BIGINT        NOT NULL,
    eaten_at            DATETIME2(0)  NOT NULL,   -- quando comeu (UTC)
    meal_type           VARCHAR(20)   NOT NULL,
    description         NVARCHAR(MAX) NOT NULL,   -- cifrado: o que comeu
    notes               NVARCHAR(MAX) NULL,       -- cifrado: como se sentiu, contexto
    hunger_level        TINYINT       NULL,       -- fome antes de comer: 1 (nenhuma) a 5 (muita)
    satisfaction_level  TINYINT       NULL,       -- saciedade depois: 1 (nada) a 5 (muito)
    photo_file          VARCHAR(100)  NULL,       -- nome do arquivo na pasta de fotos (aleatório)
    photo_content_type  VARCHAR(30)   NULL,       -- image/jpeg, image/png ou image/webp
    created_at          DATETIME2(0)  NOT NULL CONSTRAINT df_meal_logs_created_at DEFAULT SYSUTCDATETIME(),
    updated_at          DATETIME2(0)  NOT NULL CONSTRAINT df_meal_logs_updated_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_meal_logs_patient FOREIGN KEY (patient_id) REFERENCES patients (user_id) ON DELETE CASCADE,
    CONSTRAINT ck_meal_logs_type CHECK (meal_type IN
        ('CAFE_DA_MANHA', 'LANCHE_DA_MANHA', 'ALMOCO', 'LANCHE_DA_TARDE', 'JANTAR', 'CEIA', 'OUTRO')),
    CONSTRAINT ck_meal_logs_hunger       CHECK (hunger_level IS NULL OR hunger_level BETWEEN 1 AND 5),
    CONSTRAINT ck_meal_logs_satisfaction CHECK (satisfaction_level IS NULL OR satisfaction_level BETWEEN 1 AND 5),
    CONSTRAINT ck_meal_logs_photo_type   CHECK (photo_content_type IS NULL
        OR photo_content_type IN ('image/jpeg', 'image/png', 'image/webp'))
);
GO

-- O diário é sempre lido "do paciente X, do mais recente para o mais antigo"
CREATE INDEX ix_meal_logs_patient ON meal_logs (patient_id, eaten_at DESC);
GO
