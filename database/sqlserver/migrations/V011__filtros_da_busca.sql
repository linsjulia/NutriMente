-- =============================================================
-- V011: dados para os filtros da busca de profissionais (card #95)
--
-- 1. Duração da consulta: a coluna professionals.consultation_minutes já
--    existia (padrão 50) e não era usada. Agora o profissional escolhe, a
--    agenda usa a duração dele e a busca filtra por faixa (até 30, até 60,
--    acima de 60 min). Aqui só limitamos a valores razoáveis.
-- 2. Público atendido (criança, adolescente, adulto, idoso): tabela nova,
--    um profissional pode marcar vários.
-- 3. Temas da página de busca como especialidades. Cada especialidade
--    continua sendo de UMA profissão; os temas que valem para as duas
--    (Psiconutrição, comportamento alimentar) entram uma vez para cada.
--    A busca por tema procura pelos ids das duas.
-- =============================================================

ALTER TABLE professionals ADD CONSTRAINT ck_professionals_minutes
    CHECK (consultation_minutes BETWEEN 15 AND 180);
GO

CREATE TABLE professional_audiences (
    professional_id  BIGINT       NOT NULL,
    audience         VARCHAR(12)  NOT NULL,

    CONSTRAINT pk_professional_audiences PRIMARY KEY (professional_id, audience),
    CONSTRAINT fk_prof_audience_professional FOREIGN KEY (professional_id)
        REFERENCES professionals (user_id) ON DELETE CASCADE,
    CONSTRAINT ck_prof_audience CHECK (audience IN ('CRIANCA', 'ADOLESCENTE', 'ADULTO', 'IDOSO'))
);
GO

-- Temas novos (só os que ainda não existem para aquela profissão)
INSERT INTO specialties (name, professional_type)
SELECT t.name, t.professional_type
FROM (VALUES
    -- As duas profissões
    (N'Psiconutrição',                          'NUTRICIONISTA'), (N'Psiconutrição',                          'PSICOLOGO'),
    (N'Compulsão alimentar',                    'NUTRICIONISTA'), (N'Compulsão alimentar',                    'PSICOLOGO'),
    (N'Anorexia e bulimia',                     'NUTRICIONISTA'), (N'Anorexia e bulimia',                     'PSICOLOGO'),
    (N'Imagem corporal',                        'NUTRICIONISTA'), (N'Imagem corporal',                        'PSICOLOGO'),
    (N'Alimentação consciente (mindful eating)','NUTRICIONISTA'), (N'Alimentação consciente (mindful eating)','PSICOLOGO'),
    (N'Dietas restritivas e efeito sanfona',    'NUTRICIONISTA'), (N'Dietas restritivas e efeito sanfona',    'PSICOLOGO'),
    (N'Culpa alimentar',                        'NUTRICIONISTA'), (N'Culpa alimentar',                        'PSICOLOGO'),
    (N'Fome emocional e fome física',           'NUTRICIONISTA'), (N'Fome emocional e fome física',           'PSICOLOGO'),
    (N'Ortorexia',                              'NUTRICIONISTA'), (N'Ortorexia',                              'PSICOLOGO'),
    (N'Vigorexia',                              'NUTRICIONISTA'), (N'Vigorexia',                              'PSICOLOGO'),
    -- Psicologia
    (N'Estresse e burnout',      'PSICOLOGO'),
    (N'Transtorno do pânico',    'PSICOLOGO'),
    (N'Fobias',                  'PSICOLOGO'),
    (N'TOC',                     'PSICOLOGO'),
    (N'TDAH',                    'PSICOLOGO'),
    (N'Transtorno bipolar',      'PSICOLOGO'),
    (N'Luto e perdas',           'PSICOLOGO'),
    -- Nutrição
    (N'Reeducação alimentar',    'NUTRICIONISTA'),
    (N'Ganho de massa muscular', 'NUTRICIONISTA'),
    (N'Diabetes',                'NUTRICIONISTA'),
    (N'Hipertensão e colesterol','NUTRICIONISTA'),
    (N'Saúde intestinal',        'NUTRICIONISTA')
) AS t (name, professional_type)
WHERE NOT EXISTS (
    SELECT 1 FROM specialties s WHERE s.name = t.name AND s.professional_type = t.professional_type
);
GO
