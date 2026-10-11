package io.github.brunocaffz.mindmap_api.auth.token;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/** Acesso à tabela notion_tokens. Só enxerga bytes já criptografados. */
@Repository
public class TokenRepository {

    private final JdbcClient jdbc;

    public TokenRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /** Um login novo do mesmo usuário no mesmo workspace substitui o token anterior. */
    public void upsert(String userId, String workspaceId, byte[] encryptedToken) {
        jdbc.sql("""
                        INSERT INTO notion_tokens (user_id, workspace_id, access_token_encrypted)
                        VALUES (:userId, :workspaceId, :token)
                        ON CONFLICT (user_id, workspace_id)
                        DO UPDATE SET access_token_encrypted = EXCLUDED.access_token_encrypted,
                                      created_at = now()
                        """)
                .param("userId", userId)
                .param("workspaceId", workspaceId)
                .param("token", encryptedToken)
                .update();
    }

    public Optional<byte[]> find(String userId, String workspaceId) {
        return jdbc.sql("""
                        SELECT access_token_encrypted FROM notion_tokens
                        WHERE user_id = :userId AND workspace_id = :workspaceId
                        """)
                .param("userId", userId)
                .param("workspaceId", workspaceId)
                .query(byte[].class)
                .optional();
    }
}
