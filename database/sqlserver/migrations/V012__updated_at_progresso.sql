-- =============================================================
-- V012: coluna updated_at na tabela progress_records
--
-- Necessária para edição de registros de progresso (PUT/DELETE).
-- =============================================================

ALTER TABLE progress_records
    ADD updated_at DATETIME2(0) NULL;
GO
