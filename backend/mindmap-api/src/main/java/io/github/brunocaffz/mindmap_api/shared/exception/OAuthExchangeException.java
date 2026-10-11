package io.github.brunocaffz.mindmap_api.shared.exception;

/**
 * A troca do code por token falhou. {@code rejectedByNotion} é true quando o Notion recusou o code
 * (expirado, já usado): erro do pedido, 400. É false quando o problema é nosso, como credencial da
 * integração errada ou resposta fora do formato: 502. A mensagem não leva code, token nem segredo.
 */
public class OAuthExchangeException extends RuntimeException {

    private final boolean rejectedByNotion;

    public OAuthExchangeException(String message, boolean rejectedByNotion) {
        super(message);
        this.rejectedByNotion = rejectedByNotion;
    }

    public boolean isRejectedByNotion() {
        return rejectedByNotion;
    }
}
