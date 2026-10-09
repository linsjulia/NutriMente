-- =============================================================
-- V006: lembrete automático na véspera da consulta
--
-- A API confere de tempos em tempos (a cada 10 min) as consultas que
-- começam nas próximas 24 h e manda um lembrete (e-mail + notificação)
-- para o paciente e o profissional.
--
-- reminder_sent_at marca QUANDO o lembrete saiu. Serve para:
--   - não mandar duas vezes (a API só envia se a coluna estiver vazia, e
--     marca com um UPDATE ... WHERE reminder_sent_at IS NULL: mesmo com
--     duas cópias da API rodando, só uma "ganha" a consulta);
--   - consultar depois quem foi lembrado.
-- =============================================================

ALTER TABLE appointments ADD
    reminder_sent_at  DATETIME2(0)  NULL;
GO

-- Índice da busca do lembrete: consultas ativas, ainda sem lembrete, por horário
CREATE INDEX ix_appointments_reminder ON appointments (starts_at)
    INCLUDE (status, created_at)
    WHERE reminder_sent_at IS NULL;
GO
