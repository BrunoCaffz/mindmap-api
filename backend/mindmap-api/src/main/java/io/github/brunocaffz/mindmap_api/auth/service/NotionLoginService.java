package io.github.brunocaffz.mindmap_api.auth.service;

import io.github.brunocaffz.mindmap_api.auth.NotionPrincipal;
import io.github.brunocaffz.mindmap_api.auth.token.TokenStore;
import io.github.brunocaffz.mindmap_api.notion.client.NotionGrant;
import io.github.brunocaffz.mindmap_api.notion.client.NotionOAuthClient;
import org.springframework.stereotype.Service;

/** Conclui um login: troca o code por token, guarda o token criptografado e devolve quem entrou. */
@Service
public class NotionLoginService {

    private static final String FALLBACK_USER_NAME = "Usuário do Notion";
    private static final String FALLBACK_WORKSPACE_NAME = "Workspace";

    private final NotionOAuthClient oauth;
    private final TokenStore tokens;

    public NotionLoginService(NotionOAuthClient oauth, TokenStore tokens) {
        this.oauth = oauth;
        this.tokens = tokens;
    }

    public NotionPrincipal login(String code) {
        NotionGrant grant = oauth.exchangeCode(code);
        tokens.save(grant.userId(), grant.workspaceId(), grant.accessToken());
        return new NotionPrincipal(
                grant.userId(),
                orDefault(grant.userName(), FALLBACK_USER_NAME),
                grant.workspaceId(),
                orDefault(grant.workspaceName(), FALLBACK_WORKSPACE_NAME));
    }

    private static String orDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
