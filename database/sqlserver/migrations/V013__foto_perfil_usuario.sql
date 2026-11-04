-- =============================================================
-- V013: colunas para armazenar a foto de perfil do usuário
--
-- O arquivo fica no EncryptedFileStorage (mesmo mecanismo do diário
-- alimentar); aqui guardamos o nome do arquivo e o content-type.
-- photo_url continua existindo para manter compatibilidade com fotos
-- estáticas já cadastradas.
-- =============================================================

ALTER TABLE users ADD photo_file         VARCHAR(100) NULL;
GO

ALTER TABLE users ADD photo_content_type VARCHAR(50)  NULL;
GO
