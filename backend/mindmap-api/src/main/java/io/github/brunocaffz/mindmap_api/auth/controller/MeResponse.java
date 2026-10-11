package io.github.brunocaffz.mindmap_api.auth.controller;

/** O que o front pode saber de quem está logado: só nomes. Sem ids, sem token. */
public record MeResponse(String userName, String workspaceName) {
}
