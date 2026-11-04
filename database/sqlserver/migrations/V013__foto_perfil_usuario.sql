-- =============================================================
-- V013: colunas para armazenar a foto de perfil do usuário
--
-- O arquivo fica no EncryptedFileStorage (mesmo mecanismo do diário
-- alimentar); aqui guardamos o nome do arquivo e o content-type.
-- photo_url continua existindo para manter compatibilidade com fotos
-- estáticas já cadastradas.
-- =============================================================

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'photo_file')
    ALTER TABLE users ADD photo_file VARCHAR(100) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'photo_content_type')
    ALTER TABLE users ADD photo_content_type VARCHAR(50) NULL;
GO
