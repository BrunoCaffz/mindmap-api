-- Token de acesso do Notion de cada usuário, criptografado em repouso (AES-GCM).
-- O valor guardado é nonce (12 bytes) + texto cifrado + tag de autenticação; nunca o token em claro.
-- A chave de criptografia vem do ambiente (TOKEN_ENCRYPTION_KEY) e não fica no banco.
CREATE TABLE notion_tokens (
    user_id                VARCHAR(64) NOT NULL,
    workspace_id           VARCHAR(64) NOT NULL,
    access_token_encrypted BYTEA       NOT NULL,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT notion_tokens_pk PRIMARY KEY (user_id, workspace_id)
);
