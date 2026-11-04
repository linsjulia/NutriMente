-- =============================================================
-- V012: coluna updated_at na tabela progress_records
--
-- Necessária para edição de registros de progresso (PUT/DELETE).
-- =============================================================

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('progress_records') AND name = 'updated_at')
    ALTER TABLE progress_records ADD updated_at DATETIME2(0) NULL;
GO
