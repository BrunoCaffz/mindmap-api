package io.github.brunocaffz.mindmap_api.notion.client;

/**
 * O que o Notion devolve ao trocar o code por um token, já no nosso modelo: o resto do sistema não vê
 * o JSON deles. O toString não mostra o token.
 */
public record NotionGrant(
        String accessToken,
        String workspaceId,
        String workspaceName,
        String userId,
        String userName) {

    @Override
    public String toString() {
        return "NotionGrant[accessToken=<oculto>, workspaceId=" + workspaceId + ", userId=" + userId + "]";
    }
}
