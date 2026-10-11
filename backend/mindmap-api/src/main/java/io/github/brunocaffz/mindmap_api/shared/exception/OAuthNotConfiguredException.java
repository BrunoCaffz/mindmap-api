package io.github.brunocaffz.mindmap_api.shared.exception;

/** Faltam NOTION_CLIENT_ID ou NOTION_CLIENT_SECRET. Vira 503 Problem Details. */
public class OAuthNotConfiguredException extends RuntimeException {

    public OAuthNotConfiguredException() {
        super("Login com o Notion não configurado");
    }
}
