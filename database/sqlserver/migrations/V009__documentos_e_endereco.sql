-- =============================================================
-- V009: documentos do profissional e endereço do consultório
--
-- 1. professional_documents já existia (desde a 1ª versão), mas não tinha
--    como guardar o TIPO do arquivo. Agora o profissional envia a carteira
--    do conselho, o diploma ou a identidade pela tela; o arquivo vai
--    CIFRADO para a pasta da API (como as fotos do diário) e file_url
--    guarda só o nome aleatório do arquivo.
--
-- 2. Endereço do consultório: a consulta PRESENCIAL só pode ser marcada com
--    quem informou onde atende (do mesmo jeito que a ONLINE exige o
--    cadastro no e-Psi / e-Nutricionista, V003). Cidade e UF aparecem no
--    perfil público; o endereço completo, só para quem tem consulta
--    presencial marcada.
-- =============================================================

ALTER TABLE professional_documents ADD
    content_type  VARCHAR(30)  NULL;
GO
ALTER TABLE professional_documents ADD
    CONSTRAINT ck_prof_docs_content_type CHECK (content_type IS NULL
        OR content_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf'));
GO

ALTER TABLE professionals ADD
    office_address  NVARCHAR(200)  NULL,   -- rua, número, complemento, bairro
    office_city     NVARCHAR(100)  NULL,
    office_state    CHAR(2)        NULL;   -- UF
GO
ALTER TABLE professionals ADD
    CONSTRAINT ck_professionals_office_state CHECK (office_state IS NULL OR office_state IN
        ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR',
         'PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')),
    -- Ou tudo preenchido, ou nada (endereço pela metade não serve para a consulta)
    CONSTRAINT ck_professionals_office_complete CHECK (
        (office_address IS NULL AND office_city IS NULL AND office_state IS NULL)
        OR (office_address IS NOT NULL AND office_city IS NOT NULL AND office_state IS NOT NULL));
GO
