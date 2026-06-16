-- ============================================
-- V4__Create_refresh_tokens_table.sql
-- Tabella per Refresh Token (usati per JWT refresh + secure logout)
-- ============================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id            BIGSERIAL PRIMARY KEY,
    token         VARCHAR(512) NOT NULL UNIQUE,
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expiry_date   TIMESTAMP NOT NULL,
    revoked       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
