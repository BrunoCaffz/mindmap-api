package io.github.brunocaffz.mindmap_api.auth;

import java.io.Serial;
import java.io.Serializable;
import java.security.Principal;

/**
 * Quem está logado. É o que vai para a sessão (e portanto para a tabela do Spring Session): só
 * identificação e nomes para exibição. O token de acesso do Notion NUNCA fica aqui, e sim, criptografado,
 * na tabela notion_tokens, buscado por (userId, workspaceId) quando é preciso.
 *
 * <p>Implementa {@link Principal} porque o Spring Session grava {@code getName()} na coluna
 * PRINCIPAL_NAME, que tem 100 caracteres. Sem isso o nome viraria o toString inteiro do record, grande
 * demais, e o login quebraria. O id do usuário no Notion (um UUID) cabe com folga.
 */
public record NotionPrincipal(
        String userId,
        String userName,
        String workspaceId,
        String workspaceName) implements Principal, Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Override
    public String getName() {
        return userId;
    }
}
