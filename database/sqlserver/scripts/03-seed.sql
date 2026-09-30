-- =============================================================
-- NutriMente - Dados iniciais (seed)
--
-- "Seed" = dados que o sistema precisa para funcionar desde o primeiro
-- acesso. Aqui ficam só dados de domínio (listas fixas), NUNCA dados de
-- usuários reais. Para adicionar uma especialidade, inclua uma linha abaixo
-- e recrie o banco (docker compose down -v && docker compose up -d --build)
-- ou rode o INSERT manualmente.
-- O N antes do texto (N'...') indica texto Unicode, necessário para acentos.
-- =============================================================

USE NutriMente;
GO

INSERT INTO specialties (name, professional_type) VALUES
    (N'Nutrição Clínica',            'NUTRICIONISTA'),
    (N'Nutrição Esportiva',          'NUTRICIONISTA'),
    (N'Nutrição Comportamental',     'NUTRICIONISTA'),
    (N'Emagrecimento',               'NUTRICIONISTA'),
    (N'Nutrição Materno-Infantil',   'NUTRICIONISTA'),
    (N'Vegetarianismo e Veganismo',  'NUTRICIONISTA'),
    (N'Transtornos Alimentares',     'PSICOLOGO'),
    (N'Ansiedade',                   'PSICOLOGO'),
    (N'Depressão',                   'PSICOLOGO'),
    (N'Terapia Cognitivo-Comportamental', 'PSICOLOGO'),
    (N'Psicologia da Saúde',         'PSICOLOGO'),
    (N'Autoestima e Imagem Corporal','PSICOLOGO');
GO
