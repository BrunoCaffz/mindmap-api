package io.github.brunocaffz.mindmap_api.auth.service;

import io.github.brunocaffz.mindmap_api.auth.NotionPrincipal;
import io.github.brunocaffz.mindmap_api.auth.config.AppProperties;
import io.github.brunocaffz.mindmap_api.auth.token.TokenStore;
import io.github.brunocaffz.mindmap_api.notion.config.NotionProperties;
import io.github.brunocaffz.mindmap_api.notion.service.NotionAccess;
import io.github.brunocaffz.mindmap_api.shared.exception.UnauthenticatedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Decide qual token do Notion usar numa requisição: o do usuário logado, e só ele. O token pessoal
 * (NOTION_TOKEN) só entra quando app.dev-token-fallback=true, que fica desligado por padrão.
 */
@Service
public class NotionAccessResolver {
    private static final Logger log = LoggerFactory.getLogger(NotionAccessResolver.class);

    private final TokenStore tokens;
    private final AppProperties app;
    private final NotionProperties notion;

    public NotionAccessResolver(TokenStore tokens, AppProperties app, NotionProperties notion) {
        this.tokens = tokens;
        this.app = app;
        this.notion = notion;
        if (app.devTokenFallback()) {
            log.warn("app.dev-token-fallback está LIGADO: quem não estiver logado lê o Notion com o token pessoal "
                    + "(NOTION_TOKEN). Use só em desenvolvimento; em produção deixe desligado.");
        }
    }

    /** @param principal usuário logado, ou null se a requisição é anônima */
    public NotionAccess resolve(NotionPrincipal principal) {
        if (principal != null) {
            return tokens.find(principal.userId(), principal.workspaceId())
                    .map(token -> new NotionAccess(token, true))
                    // Sessão válida, mas o token sumiu ou não abre mais: é como não estar logado.
                    .orElseThrow(UnauthenticatedException::new);
        }
        if (app.devTokenFallback() && notion.token() != null && !notion.token().isBlank()) {
            return new NotionAccess(notion.token(), false);
        }
        throw new UnauthenticatedException();
    }
}
