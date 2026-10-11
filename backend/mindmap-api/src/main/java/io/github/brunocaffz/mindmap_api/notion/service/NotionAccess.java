package io.github.brunocaffz.mindmap_api.notion.service;

/**
 * Credencial usada numa leitura do Notion. {@code userOwned} é true para o token do usuário logado e
 * false para o token pessoal de desenvolvimento: se o Notion recusar o primeiro, a pessoa precisa
 * entrar de novo; se recusar o segundo, é configuração do servidor. O toString esconde o token.
 */
public record NotionAccess(String token, boolean userOwned) {

    @Override
    public String toString() {
        return "NotionAccess[token=<oculto>, userOwned=" + userOwned + "]";
    }
}
