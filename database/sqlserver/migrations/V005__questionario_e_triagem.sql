-- =============================================================
-- V005: questionário inicial do paciente e triagem antes da consulta
--
-- Os dois guardam DADO DE SAÚDE informado pelo próprio paciente (LGPD,
-- art. 11, "dado sensível"; o consentimento já é pedido no cadastro).
-- Por isso, como no registro da consulta (V002), os campos de texto livre
-- são gravados CRIPTOGRAFADOS pela API (AES-GCM) e por isso são
-- NVARCHAR(MAX). As escolhas fechadas (nível de atividade, notas de 1 a 5)
-- ficam abertas: sozinhas dizem pouco e permitem CHECKs no banco.
-- =============================================================

-- -------------------------------------------------------------
-- Questionário inicial (onboarding): um por paciente, respondido depois
-- do cadastro e editável depois. Ajuda o profissional a conhecer o
-- paciente antes da primeira consulta.
-- -------------------------------------------------------------
CREATE TABLE patient_intakes (
    patient_id            BIGINT        PRIMARY KEY,
    -- Objetivos escolhidos, separados por vírgula (ex.: 'EMAGRECER,MELHORAR_SONO').
    -- A lista de opções válidas fica na API (enum IntakeGoal).
    goals                 VARCHAR(200)  NOT NULL,
    meals_per_day         TINYINT       NOT NULL,
    water_liters_per_day  DECIMAL(3,1)  NOT NULL,
    activity_level        VARCHAR(20)   NOT NULL,
    sleep_quality         TINYINT       NOT NULL,   -- 1 (muito ruim) a 5 (muito boa)
    stress_level          TINYINT       NOT NULL,   -- 1 (muito baixo) a 5 (muito alto)
    dietary_restrictions  NVARCHAR(MAX) NULL,       -- cifrado: alergias, intolerâncias, vegetarianismo...
    health_conditions     NVARCHAR(MAX) NULL,       -- cifrado: doenças, medicamentos, acompanhamentos
    expectations          NVARCHAR(MAX) NULL,       -- cifrado: o que espera do acompanhamento
    created_at            DATETIME2(0)  NOT NULL CONSTRAINT df_patient_intakes_created_at DEFAULT SYSUTCDATETIME(),
    updated_at            DATETIME2(0)  NOT NULL CONSTRAINT df_patient_intakes_updated_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_patient_intakes_patient FOREIGN KEY (patient_id) REFERENCES patients (user_id) ON DELETE CASCADE,
    CONSTRAINT ck_patient_intakes_meals    CHECK (meals_per_day BETWEEN 1 AND 10),
    CONSTRAINT ck_patient_intakes_water    CHECK (water_liters_per_day BETWEEN 0 AND 10),
    CONSTRAINT ck_patient_intakes_activity CHECK (activity_level IN ('SEDENTARIO', 'LEVE', 'MODERADO', 'INTENSO')),
    CONSTRAINT ck_patient_intakes_sleep    CHECK (sleep_quality BETWEEN 1 AND 5),
    CONSTRAINT ck_patient_intakes_stress   CHECK (stress_level BETWEEN 1 AND 5)
);
GO

-- -------------------------------------------------------------
-- Triagem: o paciente conta o motivo e os sintomas ATUAIS antes da
-- consulta (no agendamento, e pode ajustar até o início). Uma por
-- consulta. Sem cascata, como a consulta: faz parte do histórico clínico.
-- -------------------------------------------------------------
CREATE TABLE appointment_screenings (
    appointment_id  BIGINT        PRIMARY KEY,
    reason          NVARCHAR(MAX) NOT NULL,   -- cifrado: motivo da consulta
    symptoms        NVARCHAR(MAX) NULL,       -- cifrado: sintomas atuais
    mood_score      TINYINT       NULL,       -- como está se sentindo: 1 (muito mal) a 5 (muito bem)
    created_at      DATETIME2(0)  NOT NULL CONSTRAINT df_appointment_screenings_created_at DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2(0)  NOT NULL CONSTRAINT df_appointment_screenings_updated_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_appointment_screenings_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id),
    CONSTRAINT ck_appointment_screenings_mood CHECK (mood_score IS NULL OR mood_score BETWEEN 1 AND 5)
);
GO
