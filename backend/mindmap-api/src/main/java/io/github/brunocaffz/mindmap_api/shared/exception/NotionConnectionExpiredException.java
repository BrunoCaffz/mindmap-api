package io.github.brunocaffz.mindmap_api.shared.exception;

/** O Notion recusou o token guardado do usuário (revogado ou expirado). Vira 401: é preciso entrar de novo. */
public class NotionConnectionExpiredException extends RuntimeException {

    public NotionConnectionExpiredException() {
        super("Acesso ao Notion expirado");
    }
}
