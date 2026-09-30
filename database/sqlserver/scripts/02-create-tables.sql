-- =============================================================
-- NutriMente - Estrutura das tabelas (SQL Server)
-- Logs de aplicação/auditoria NÃO ficam aqui: vão para o MongoDB
-- (ver database/mongodb/init/01-init-logs.js).
--
-- GUIA RÁPIDO PARA QUEM ESTÁ COMEÇANDO
-- -------------------------------------------------------------
-- PRIMARY KEY (PK) ...... identificador único de cada linha da tabela.
-- IDENTITY(1,1) ......... o próprio banco gera o id: começa em 1 e soma 1.
-- BIGINT ................ número inteiro grande (usamos em todos os ids).
-- NVARCHAR(n) ........... texto com acentos/emoji, até n caracteres.
-- VARCHAR(n) / CHAR(n) .. texto simples (códigos, status). CHAR tem
--                         tamanho fixo (ex.: CPF sempre com 11 dígitos).
-- DECIMAL(10,2) ......... número com casas decimais exatas (dinheiro).
--                         NUNCA use FLOAT para dinheiro (arredonda errado).
-- DATE / TIME ........... só data / só hora.
-- DATETIME2(0) .......... data + hora. Gravamos SEMPRE em UTC
--                         (SYSUTCDATETIME) e o front converte para o
--                         horário de Brasília na hora de exibir.
-- BIT ................... verdadeiro (1) ou falso (0).
-- NULL / NOT NULL ....... se a coluna pode ou não ficar vazia.
-- DEFAULT ............... valor usado quando o INSERT não informa a coluna.
--
-- CONSTRAINT (regras que o banco garante sozinho):
--   FOREIGN KEY (FK) .... "esta coluna aponta para o id de outra tabela".
--                         Impede, por ex., consulta de um paciente que
--                         não existe.
--   ON DELETE CASCADE ... ao apagar o "pai", apaga os "filhos" juntos.
--                         Só usamos onde o filho não faz sentido sozinho.
--   UNIQUE .............. não deixa repetir o valor (ex.: e-mail).
--   CHECK ............... valida o valor (ex.: nota entre 1 e 5).
--
-- Padrão de nomes: pk_ (primária), fk_ (estrangeira), uq_ (única),
-- ck_ (check), df_ (default), ix_ (índice). Assim, quando der erro,
-- a mensagem já diz qual regra foi violada.
--
-- INDEX (índice) = "sumário" que deixa buscas e JOINs rápidos, como o
-- índice de um livro. O SQL Server NÃO cria índice automático em FK,
-- por isso criamos manualmente nas colunas usadas em buscas/JOINs.
--   INCLUDE (...) ....... guarda colunas extras no índice para a consulta
--                         nem precisar ir na tabela.
--   WHERE ... (filtrado)  indexa só parte das linhas (ex.: só não lidas),
--                         fica menor e mais rápido.
--
-- Colunas updated_at: o banco preenche na criação; nas alterações quem
-- atualiza é a API Java (@UpdateTimestamp no JPA/Hibernate).
--
-- GO = separa o script em blocos enviados ao servidor um por vez.
-- =============================================================

USE NutriMente;
GO

-- -------------------------------------------------------------
-- Usuários e perfis
-- -------------------------------------------------------------

-- Todas as pessoas que fazem login (paciente, profissional ou admin).
-- Dados comuns ficam aqui; dados específicos ficam em patients/professionals
-- (padrão "herança por tabela": o id do usuário é reaproveitado como PK lá).
-- A senha NUNCA é salva em texto puro: a API Java grava só o hash (BCrypt).
CREATE TABLE users (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    name            NVARCHAR(150)  NOT NULL,
    email           NVARCHAR(255)  NOT NULL,
    password_hash   NVARCHAR(255)  NULL,          -- NULL quando o login é só via Google
    google_id       NVARCHAR(255)  NULL,
    telephone       VARCHAR(20)    NULL,
    cpf             CHAR(11)       NULL,          -- somente dígitos
    birth_date      DATE           NULL,
    gender          VARCHAR(12)    NULL,          -- opcional (LGPD: só coletamos se a pessoa quiser)
    photo_url       NVARCHAR(500)  NULL,
    role            VARCHAR(20)    NOT NULL,      -- tipo de conta: define o que a pessoa pode acessar
    is_active       BIT            NOT NULL CONSTRAINT df_users_is_active DEFAULT 1,
    email_verified  BIT            NOT NULL CONSTRAINT df_users_email_verified DEFAULT 0,
    last_login_at   DATETIME2(0)   NULL,
    -- Proteção contra força bruta: após 5 senhas erradas seguidas a conta
    -- fica bloqueada por 15 minutos (regra aplicada pela API Java)
    failed_login_attempts TINYINT  NOT NULL CONSTRAINT df_users_failed_logins DEFAULT 0,
    locked_until    DATETIME2(0)   NULL,
    created_at      DATETIME2(0)   NOT NULL CONSTRAINT df_users_created_at DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2(0)   NOT NULL CONSTRAINT df_users_updated_at DEFAULT SYSUTCDATETIME(),
    deleted_at      DATETIME2(0)   NULL,          -- exclusão lógica (LGPD: anonimização posterior)

    CONSTRAINT uq_users_email  UNIQUE (email),
    CONSTRAINT ck_users_role   CHECK (role IN ('PATIENT', 'PROFESSIONAL', 'ADMIN')),
    CONSTRAINT ck_users_gender CHECK (gender IN ('FEMALE', 'MALE', 'OTHER', 'UNDISCLOSED')),
    CONSTRAINT ck_users_cpf    CHECK (cpf NOT LIKE '%[^0-9]%' AND LEN(cpf) = 11)
);
-- Índice único FILTRADO: CPF não pode repetir, mas vários usuários podem
-- ficar sem CPF (NULL), ex.: cadastro via Google ainda incompleto.
CREATE UNIQUE INDEX uq_users_cpf       ON users (cpf)       WHERE cpf IS NOT NULL;
CREATE UNIQUE INDEX uq_users_google_id ON users (google_id) WHERE google_id IS NOT NULL;
GO

-- Perfil de paciente. user_id é ao mesmo tempo PK e FK para users.
-- Hoje só tem created_at, mas é aqui que entram dados exclusivos do paciente.
CREATE TABLE patients (
    user_id     BIGINT PRIMARY KEY,
    created_at  DATETIME2(0) NOT NULL CONSTRAINT df_patients_created_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
GO

-- Perfil de profissional (nutricionista ou psicólogo), preenchido pelas
-- 3 etapas do formulário RegisterProfessional.tsx.
-- rating_average/rating_count são uma cópia "pré-calculada" das avaliações
-- (desnormalização) para a busca não precisar calcular média toda vez.
-- A API deve atualizá-los sempre que uma avaliação for criada.
CREATE TABLE professionals (
    user_id                BIGINT PRIMARY KEY,
    professional_type      VARCHAR(20)    NOT NULL,
    document_professional  VARCHAR(20)    NOT NULL,   -- CRN (nutricionista) ou CRP (psicólogo)
    bio                    NVARCHAR(500)  NULL,
    consultation_price     DECIMAL(10,2)  NULL,
    consultation_minutes   SMALLINT       NOT NULL CONSTRAINT df_professionals_minutes DEFAULT 50,
    verification_status    VARCHAR(20)    NOT NULL CONSTRAINT df_professionals_verification DEFAULT 'PENDING',
    verified_at            DATETIME2(0)   NULL,
    rating_average         DECIMAL(3,2)   NOT NULL CONSTRAINT df_professionals_rating DEFAULT 0,
    rating_count           INT            NOT NULL CONSTRAINT df_professionals_rating_count DEFAULT 0,
    created_at             DATETIME2(0)   NOT NULL CONSTRAINT df_professionals_created_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_professionals_user   FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_professionals_doc    UNIQUE (professional_type, document_professional),
    CONSTRAINT ck_professionals_type   CHECK (professional_type IN ('NUTRICIONISTA', 'PSICOLOGO')),
    CONSTRAINT ck_professionals_status CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT ck_professionals_price  CHECK (consultation_price IS NULL OR consultation_price >= 0)
);
-- Índice da tela de busca: filtra por tipo + aprovado + faixa de preço
-- e já traz a nota para ordenar sem ler a tabela inteira.
CREATE INDEX ix_professionals_search ON professionals (professional_type, verification_status, consultation_price)
    INCLUDE (rating_average, rating_count);
GO

-- Documentos enviados para verificação do registro profissional
CREATE TABLE professional_documents (
    id               BIGINT IDENTITY(1,1) PRIMARY KEY,
    professional_id  BIGINT         NOT NULL,
    document_type    VARCHAR(30)    NOT NULL,
    file_url         NVARCHAR(500)  NOT NULL,
    status           VARCHAR(20)    NOT NULL CONSTRAINT df_prof_docs_status DEFAULT 'PENDING',
    reviewed_by      BIGINT         NULL,
    review_notes     NVARCHAR(500)  NULL,
    reviewed_at      DATETIME2(0)   NULL,
    created_at       DATETIME2(0)   NOT NULL CONSTRAINT df_prof_docs_created_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_prof_docs_professional FOREIGN KEY (professional_id) REFERENCES professionals (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_prof_docs_reviewer     FOREIGN KEY (reviewed_by) REFERENCES users (id),
    CONSTRAINT ck_prof_docs_type   CHECK (document_type IN ('REGISTRO_CONSELHO', 'DIPLOMA', 'IDENTIDADE', 'OUTRO')),
    CONSTRAINT ck_prof_docs_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);
CREATE INDEX ix_prof_docs_professional ON professional_documents (professional_id);
-- Fila de verificação do admin
CREATE INDEX ix_prof_docs_pending ON professional_documents (created_at) WHERE status = 'PENDING';
GO

-- Lista de especialidades (ex.: "Ansiedade", "Nutrição Esportiva").
-- Preenchida pelo 03-seed.sql. Usada no filtro de busca de profissionais.
CREATE TABLE specialties (
    id                 INT IDENTITY(1,1) PRIMARY KEY,
    name               NVARCHAR(100) NOT NULL,
    professional_type  VARCHAR(20)   NOT NULL,

    CONSTRAINT ck_specialties_type CHECK (professional_type IN ('NUTRICIONISTA', 'PSICOLOGO')),
    CONSTRAINT uq_specialties      UNIQUE (professional_type, name)
);
GO

-- Tabela de ligação N:N: um profissional tem várias especialidades e uma
-- especialidade tem vários profissionais. A PK é a dupla das duas colunas.
CREATE TABLE professional_specialties (
    professional_id  BIGINT NOT NULL,
    specialty_id     INT    NOT NULL,

    CONSTRAINT pk_professional_specialties PRIMARY KEY (professional_id, specialty_id),
    CONSTRAINT fk_prof_spec_professional FOREIGN KEY (professional_id) REFERENCES professionals (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_prof_spec_specialty    FOREIGN KEY (specialty_id) REFERENCES specialties (id) ON DELETE CASCADE
);
CREATE INDEX ix_prof_spec_specialty ON professional_specialties (specialty_id);
GO

-- -------------------------------------------------------------
-- Autenticação e LGPD
-- -------------------------------------------------------------

-- Tokens enviados por e-mail, usados em dois fluxos:
--   EMAIL_VERIFICATION -> link "Confirme seu e-mail" após o cadastro (24h)
--   PASSWORD_RESET     -> link "Esqueceu sua senha?" da tela de login (1h)
-- Guardamos só o HASH (SHA-256) do token: se o banco vazar, os links dos
-- e-mails não podem ser reaproveitados. O token expira (expires_at) e é de
-- uso único (used_at).
CREATE TABLE user_tokens (
    id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id     BIGINT        NOT NULL,
    purpose     VARCHAR(20)   NOT NULL,
    token_hash  CHAR(64)      NOT NULL,
    expires_at  DATETIME2(0)  NOT NULL,
    used_at     DATETIME2(0)  NULL,
    created_at  DATETIME2(0)  NOT NULL CONSTRAINT df_user_tokens_created_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_user_tokens_user    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_user_tokens_hash    UNIQUE (token_hash),
    CONSTRAINT ck_user_tokens_purpose CHECK (purpose IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET'))
);
-- Busca dos tokens ainda válidos de um usuário (para invalidar os antigos)
CREATE INDEX ix_user_tokens_user ON user_tokens (user_id, purpose) WHERE used_at IS NULL;
GO

-- Registro dos aceites da LGPD (Lei 13.709/2018). Dados de saúde são
-- "dados sensíveis" e exigem consentimento específico; precisamos provar
-- quando e qual versão do termo o usuário aceitou. Nunca apagamos a linha,
-- só marcamos revoked_at quando o consentimento é retirado.
CREATE TABLE lgpd_consents (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    consent_type    VARCHAR(30)   NOT NULL,
    terms_version   VARCHAR(20)   NOT NULL,
    accepted        BIT           NOT NULL,
    ip_address      VARCHAR(45)   NULL,
    created_at      DATETIME2(0)  NOT NULL CONSTRAINT df_lgpd_created_at DEFAULT SYSUTCDATETIME(),
    revoked_at      DATETIME2(0)  NULL,

    CONSTRAINT fk_lgpd_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_lgpd_type CHECK (consent_type IN ('TERMOS_DE_USO', 'POLITICA_PRIVACIDADE', 'DADOS_SENSIVEIS_SAUDE', 'MARKETING'))
);
CREATE INDEX ix_lgpd_user ON lgpd_consents (user_id, consent_type);
GO

-- -------------------------------------------------------------
-- Agenda e consultas
-- -------------------------------------------------------------

-- Horários em que o profissional atende, repetidos toda semana
-- (ex.: segunda das 08:00 às 12:00). A API cruza isso com appointments
-- para mostrar os horários livres.
CREATE TABLE professional_availability (
    id               BIGINT IDENTITY(1,1) PRIMARY KEY,
    professional_id  BIGINT    NOT NULL,
    day_of_week      TINYINT   NOT NULL,         -- 0 = domingo ... 6 = sábado
    start_time       TIME(0)   NOT NULL,
    end_time         TIME(0)   NOT NULL,
    is_active        BIT       NOT NULL CONSTRAINT df_availability_active DEFAULT 1,

    CONSTRAINT fk_availability_professional FOREIGN KEY (professional_id) REFERENCES professionals (user_id) ON DELETE CASCADE,
    CONSTRAINT ck_availability_day   CHECK (day_of_week BETWEEN 0 AND 6),
    CONSTRAINT ck_availability_range CHECK (end_time > start_time)
);
CREATE INDEX ix_availability_professional ON professional_availability (professional_id, day_of_week);
GO

-- Consultas agendadas. Não usamos CASCADE aqui de propósito: histórico de
-- consulta/pagamento não pode sumir se alguém apagar a conta.
-- rescheduled_from_id aponta para a consulta original quando há reagendamento.
-- price é copiado do profissional no momento do agendamento (se ele mudar
-- o preço depois, a consulta antiga mantém o valor combinado).
CREATE TABLE appointments (
    id                   BIGINT IDENTITY(1,1) PRIMARY KEY,
    patient_id           BIGINT         NOT NULL,
    professional_id      BIGINT         NOT NULL,
    starts_at            DATETIME2(0)   NOT NULL,
    ends_at              DATETIME2(0)   NOT NULL,
    status               VARCHAR(20)    NOT NULL CONSTRAINT df_appointments_status DEFAULT 'SCHEDULED',
    modality             VARCHAR(10)    NOT NULL CONSTRAINT df_appointments_modality DEFAULT 'ONLINE',
    video_url            NVARCHAR(500)  NULL,
    price                DECIMAL(10,2)  NOT NULL,
    notes                NVARCHAR(1000) NULL,
    cancellation_reason  NVARCHAR(500)  NULL,
    cancelled_by         BIGINT         NULL,
    rescheduled_from_id  BIGINT         NULL,
    created_at           DATETIME2(0)   NOT NULL CONSTRAINT df_appointments_created_at DEFAULT SYSUTCDATETIME(),
    updated_at           DATETIME2(0)   NOT NULL CONSTRAINT df_appointments_updated_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_appointments_patient      FOREIGN KEY (patient_id)      REFERENCES patients (user_id),
    CONSTRAINT fk_appointments_professional FOREIGN KEY (professional_id) REFERENCES professionals (user_id),
    CONSTRAINT fk_appointments_cancelled_by FOREIGN KEY (cancelled_by)    REFERENCES users (id),
    CONSTRAINT fk_appointments_rescheduled  FOREIGN KEY (rescheduled_from_id) REFERENCES appointments (id),
    CONSTRAINT ck_appointments_status   CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW')),
    CONSTRAINT ck_appointments_modality CHECK (modality IN ('ONLINE', 'PRESENCIAL')),
    CONSTRAINT ck_appointments_range    CHECK (ends_at > starts_at),
    CONSTRAINT ck_appointments_price    CHECK (price >= 0)
);
CREATE INDEX ix_appointments_professional ON appointments (professional_id, starts_at) INCLUDE (ends_at, status);
CREATE INDEX ix_appointments_patient      ON appointments (patient_id, starts_at) INCLUDE (ends_at, status);
-- Impede dois agendamentos ATIVOS no mesmo horário para o mesmo
-- profissional (ou paciente). Consultas canceladas/reagendadas ficam fora
-- do filtro, então o horário pode ser reutilizado.
-- Atenção: isso só pega horário de início igual. Sobreposição parcial
-- (ex.: 13:00-13:50 e 13:30-14:20) precisa ser validada na API Java.
CREATE UNIQUE INDEX uq_appointments_professional_slot ON appointments (professional_id, starts_at)
    WHERE status IN ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED');
CREATE UNIQUE INDEX uq_appointments_patient_slot ON appointments (patient_id, starts_at)
    WHERE status IN ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED');
GO

-- Avaliação do paciente após a consulta (1 a 5 estrelas).
-- UNIQUE em appointment_id: só uma avaliação por consulta.
CREATE TABLE reviews (
    id               BIGINT IDENTITY(1,1) PRIMARY KEY,
    appointment_id   BIGINT         NOT NULL,
    patient_id       BIGINT         NOT NULL,
    professional_id  BIGINT         NOT NULL,
    rating           TINYINT        NOT NULL,
    comment          NVARCHAR(1000) NULL,
    created_at       DATETIME2(0)   NOT NULL CONSTRAINT df_reviews_created_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_reviews_appointment  FOREIGN KEY (appointment_id)  REFERENCES appointments (id),
    CONSTRAINT fk_reviews_patient      FOREIGN KEY (patient_id)      REFERENCES patients (user_id),
    CONSTRAINT fk_reviews_professional FOREIGN KEY (professional_id) REFERENCES professionals (user_id),
    CONSTRAINT uq_reviews_appointment  UNIQUE (appointment_id),
    CONSTRAINT ck_reviews_rating       CHECK (rating BETWEEN 1 AND 5)
);
CREATE INDEX ix_reviews_professional ON reviews (professional_id, created_at DESC) INCLUDE (rating);
CREATE INDEX ix_reviews_patient      ON reviews (patient_id);
GO

-- -------------------------------------------------------------
-- Plano de ação personalizado
-- -------------------------------------------------------------

-- Plano de ação personalizado criado pelo profissional para o paciente.
-- As tabelas abaixo (metas, rotina alimentar, checklist, progresso) são
-- "filhas" do plano e são apagadas junto com ele (CASCADE).
CREATE TABLE action_plans (
    id               BIGINT IDENTITY(1,1) PRIMARY KEY,
    patient_id       BIGINT         NOT NULL,
    professional_id  BIGINT         NOT NULL,
    title            NVARCHAR(150)  NOT NULL,
    description      NVARCHAR(2000) NULL,
    start_date       DATE           NOT NULL,
    end_date         DATE           NULL,
    status           VARCHAR(20)    NOT NULL CONSTRAINT df_action_plans_status DEFAULT 'ACTIVE',
    created_at       DATETIME2(0)   NOT NULL CONSTRAINT df_action_plans_created_at DEFAULT SYSUTCDATETIME(),
    updated_at       DATETIME2(0)   NOT NULL CONSTRAINT df_action_plans_updated_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_action_plans_patient      FOREIGN KEY (patient_id)      REFERENCES patients (user_id),
    CONSTRAINT fk_action_plans_professional FOREIGN KEY (professional_id) REFERENCES professionals (user_id),
    CONSTRAINT ck_action_plans_status CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT ck_action_plans_range  CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX ix_action_plans_patient      ON action_plans (patient_id, status);
CREATE INDEX ix_action_plans_professional ON action_plans (professional_id, status);
GO

-- Metas do plano (ex.: "beber 8 copos de água", "perder 3 kg").
CREATE TABLE plan_goals (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    plan_id       BIGINT         NOT NULL,
    description   NVARCHAR(500)  NOT NULL,
    target_value  DECIMAL(10,2)  NULL,
    unit          NVARCHAR(20)   NULL,          -- ex.: kg, copos, horas
    due_date      DATE           NULL,
    completed_at  DATETIME2(0)   NULL,
    created_at    DATETIME2(0)   NOT NULL CONSTRAINT df_plan_goals_created_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_plan_goals_plan FOREIGN KEY (plan_id) REFERENCES action_plans (id) ON DELETE CASCADE
);
CREATE INDEX ix_plan_goals_plan ON plan_goals (plan_id);
GO

-- Rotina alimentar do plano: qual refeição, horário e o que comer.
CREATE TABLE meal_routines (
    id           BIGINT IDENTITY(1,1) PRIMARY KEY,
    plan_id      BIGINT         NOT NULL,
    meal_type    VARCHAR(20)    NOT NULL,
    meal_time    TIME(0)        NULL,
    day_of_week  TINYINT        NULL,          -- NULL = todos os dias
    description  NVARCHAR(1000) NOT NULL,

    CONSTRAINT fk_meal_routines_plan FOREIGN KEY (plan_id) REFERENCES action_plans (id) ON DELETE CASCADE,
    CONSTRAINT ck_meal_routines_type CHECK (meal_type IN ('CAFE_DA_MANHA', 'LANCHE_MANHA', 'ALMOCO', 'LANCHE_TARDE', 'JANTAR', 'CEIA')),
    CONSTRAINT ck_meal_routines_day  CHECK (day_of_week IS NULL OR day_of_week BETWEEN 0 AND 6)
);
CREATE INDEX ix_meal_routines_plan ON meal_routines (plan_id);
GO

-- Tarefas que o paciente deve marcar (diária, semanal ou única).
CREATE TABLE checklist_items (
    id           BIGINT IDENTITY(1,1) PRIMARY KEY,
    plan_id      BIGINT        NOT NULL,
    description  NVARCHAR(300) NOT NULL,
    frequency    VARCHAR(10)   NOT NULL CONSTRAINT df_checklist_frequency DEFAULT 'DAILY',
    is_active    BIT           NOT NULL CONSTRAINT df_checklist_active DEFAULT 1,

    CONSTRAINT fk_checklist_items_plan FOREIGN KEY (plan_id) REFERENCES action_plans (id) ON DELETE CASCADE,
    CONSTRAINT ck_checklist_frequency  CHECK (frequency IN ('DAILY', 'WEEKLY', 'ONCE'))
);
CREATE INDEX ix_checklist_items_plan ON checklist_items (plan_id);
GO

-- Marcação do paciente em cada item do checklist
CREATE TABLE checklist_entries (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    item_id       BIGINT        NOT NULL,
    entry_date    DATE          NOT NULL,
    completed     BIT           NOT NULL,
    created_at    DATETIME2(0)  NOT NULL CONSTRAINT df_checklist_entries_created_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_checklist_entries_item FOREIGN KEY (item_id) REFERENCES checklist_items (id) ON DELETE CASCADE,
    CONSTRAINT uq_checklist_entries      UNIQUE (item_id, entry_date)
);
GO

-- Registro periódico de evolução (peso, humor, observações).
-- Pode ser feito pelo paciente ou pelo profissional (recorded_by).
CREATE TABLE progress_records (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    plan_id       BIGINT         NOT NULL,
    recorded_by   BIGINT         NOT NULL,
    record_date   DATE           NOT NULL,
    weight_kg     DECIMAL(5,2)   NULL,
    mood_score    TINYINT        NULL,          -- 1 (muito mal) a 5 (muito bem)
    notes         NVARCHAR(2000) NULL,
    created_at    DATETIME2(0)   NOT NULL CONSTRAINT df_progress_created_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_progress_plan        FOREIGN KEY (plan_id)     REFERENCES action_plans (id) ON DELETE CASCADE,
    CONSTRAINT fk_progress_recorded_by FOREIGN KEY (recorded_by) REFERENCES users (id),
    CONSTRAINT ck_progress_mood        CHECK (mood_score IS NULL OR mood_score BETWEEN 1 AND 5),
    CONSTRAINT ck_progress_weight      CHECK (weight_kg IS NULL OR weight_kg > 0)
);
CREATE INDEX ix_progress_plan ON progress_records (plan_id, record_date);
CREATE INDEX ix_progress_recorded_by ON progress_records (recorded_by);
GO

-- -------------------------------------------------------------
-- Comunicação
-- -------------------------------------------------------------

-- Chat: uma conversa por dupla paciente + profissional (UNIQUE).
-- last_message_at é atualizado a cada mensagem para ordenar a lista de chats.
CREATE TABLE conversations (
    id               BIGINT IDENTITY(1,1) PRIMARY KEY,
    patient_id       BIGINT        NOT NULL,
    professional_id  BIGINT        NOT NULL,
    last_message_at  DATETIME2(0)  NULL,
    created_at       DATETIME2(0)  NOT NULL CONSTRAINT df_conversations_created_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_conversations_patient      FOREIGN KEY (patient_id)      REFERENCES patients (user_id),
    CONSTRAINT fk_conversations_professional FOREIGN KEY (professional_id) REFERENCES professionals (user_id),
    CONSTRAINT uq_conversations UNIQUE (patient_id, professional_id)
);
CREATE INDEX ix_conversations_professional ON conversations (professional_id, last_message_at DESC);
GO

-- Mensagens do chat. DATETIME2(3) guarda milissegundos para manter a ordem
-- correta de mensagens enviadas no mesmo segundo. read_at NULL = não lida.
CREATE TABLE messages (
    id               BIGINT IDENTITY(1,1) PRIMARY KEY,
    conversation_id  BIGINT         NOT NULL,
    sender_id        BIGINT         NOT NULL,
    content          NVARCHAR(4000) NOT NULL,
    read_at          DATETIME2(0)   NULL,
    created_at       DATETIME2(3)   NOT NULL CONSTRAINT df_messages_created_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender       FOREIGN KEY (sender_id)       REFERENCES users (id)
);
CREATE INDEX ix_messages_conversation ON messages (conversation_id, created_at);
-- Contador de não lidas por conversa
CREATE INDEX ix_messages_unread ON messages (conversation_id, sender_id) WHERE read_at IS NULL;
GO

-- Notificações exibidas no sininho do app. read_at NULL = não lida.
CREATE TABLE notifications (
    id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id     BIGINT         NOT NULL,
    type        VARCHAR(30)    NOT NULL,
    title       NVARCHAR(150)  NOT NULL,
    body        NVARCHAR(1000) NULL,
    link_url    NVARCHAR(500)  NULL,
    read_at     DATETIME2(0)   NULL,
    created_at  DATETIME2(0)   NOT NULL CONSTRAINT df_notifications_created_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_notifications_type CHECK (type IN ('APPOINTMENT', 'MESSAGE', 'PLAN', 'PAYMENT', 'REVIEW', 'SYSTEM'))
);
CREATE INDEX ix_notifications_user   ON notifications (user_id, created_at DESC);
CREATE INDEX ix_notifications_unread ON notifications (user_id) WHERE read_at IS NULL;
GO

-- -------------------------------------------------------------
-- Financeiro
-- -------------------------------------------------------------

-- Carteira digital: uma por usuário. balance é o saldo atual; o histórico
-- de cada movimento fica em wallet_transactions (como um extrato bancário).
CREATE TABLE wallets (
    id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id     BIGINT         NOT NULL,
    balance     DECIMAL(12,2)  NOT NULL CONSTRAINT df_wallets_balance DEFAULT 0,
    updated_at  DATETIME2(0)   NOT NULL CONSTRAINT df_wallets_updated_at DEFAULT SYSUTCDATETIME(),
    -- ROWVERSION muda sozinho a cada UPDATE. No Java, mapeie com @Version:
    -- se duas requisições tentarem debitar a carteira ao mesmo tempo, a
    -- segunda falha em vez de gerar saldo errado (controle otimista).
    row_version ROWVERSION     NOT NULL,

    CONSTRAINT fk_wallets_user    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_wallets_user    UNIQUE (user_id),
    CONSTRAINT ck_wallets_balance CHECK (balance >= 0)
);
GO

-- Pagamento de uma consulta. Nunca guardamos número de cartão: quem cuida
-- disso é o gateway de pagamento; aqui só fica a referência dele.
CREATE TABLE payments (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    appointment_id      BIGINT         NOT NULL,
    payer_id            BIGINT         NOT NULL,
    amount              DECIMAL(10,2)  NOT NULL,
    method              VARCHAR(20)    NOT NULL,
    status              VARCHAR(20)    NOT NULL CONSTRAINT df_payments_status DEFAULT 'PENDING',
    gateway_reference   NVARCHAR(100)  NULL,     -- id da transação no gateway (nunca dados do cartão)
    paid_at             DATETIME2(0)   NULL,
    created_at          DATETIME2(0)   NOT NULL CONSTRAINT df_payments_created_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_payments_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id),
    CONSTRAINT fk_payments_payer       FOREIGN KEY (payer_id)       REFERENCES users (id),
    CONSTRAINT ck_payments_method CHECK (method IN ('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO', 'CARTEIRA')),
    CONSTRAINT ck_payments_status CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED')),
    CONSTRAINT ck_payments_amount CHECK (amount > 0)
);
CREATE INDEX ix_payments_appointment ON payments (appointment_id);
-- No máximo um pagamento efetivado por consulta
CREATE UNIQUE INDEX uq_payments_appointment_paid ON payments (appointment_id) WHERE status = 'PAID';
CREATE INDEX ix_payments_payer       ON payments (payer_id, created_at DESC);
GO

-- Pedidos de reembolso (fluxo: REQUESTED -> APPROVED/REJECTED -> COMPLETED).
CREATE TABLE refunds (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    payment_id    BIGINT         NOT NULL,
    requested_by  BIGINT         NOT NULL,
    amount        DECIMAL(10,2)  NOT NULL,
    reason        NVARCHAR(500)  NOT NULL,
    status        VARCHAR(20)    NOT NULL CONSTRAINT df_refunds_status DEFAULT 'REQUESTED',
    resolved_at   DATETIME2(0)   NULL,
    created_at    DATETIME2(0)   NOT NULL CONSTRAINT df_refunds_created_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_refunds_payment      FOREIGN KEY (payment_id)   REFERENCES payments (id),
    CONSTRAINT fk_refunds_requested_by FOREIGN KEY (requested_by) REFERENCES users (id),
    CONSTRAINT ck_refunds_status CHECK (status IN ('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED')),
    CONSTRAINT ck_refunds_amount CHECK (amount > 0)
);
CREATE INDEX ix_refunds_payment      ON refunds (payment_id);
CREATE INDEX ix_refunds_requested_by ON refunds (requested_by);
GO

-- Extrato da carteira: cada crédito/débito vira uma linha e nunca é
-- alterado. Assim dá para auditar e recalcular o saldo se precisar.
CREATE TABLE wallet_transactions (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    wallet_id       BIGINT         NOT NULL,
    type            VARCHAR(20)    NOT NULL,
    amount          DECIMAL(12,2)  NOT NULL,
    payment_id      BIGINT         NULL,
    refund_id       BIGINT         NULL,
    description     NVARCHAR(255)  NULL,
    created_at      DATETIME2(0)   NOT NULL CONSTRAINT df_wallet_tx_created_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_wallet_tx_wallet  FOREIGN KEY (wallet_id)  REFERENCES wallets (id) ON DELETE CASCADE,
    CONSTRAINT fk_wallet_tx_payment FOREIGN KEY (payment_id) REFERENCES payments (id),
    CONSTRAINT fk_wallet_tx_refund  FOREIGN KEY (refund_id)  REFERENCES refunds (id),
    CONSTRAINT ck_wallet_tx_type   CHECK (type IN ('CREDIT', 'DEBIT', 'REFUND', 'WITHDRAWAL')),
    CONSTRAINT ck_wallet_tx_amount CHECK (amount > 0)
);
CREATE INDEX ix_wallet_tx_wallet  ON wallet_transactions (wallet_id, created_at DESC);
CREATE INDEX ix_wallet_tx_payment ON wallet_transactions (payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX ix_wallet_tx_refund  ON wallet_transactions (refund_id)  WHERE refund_id IS NOT NULL;
GO
