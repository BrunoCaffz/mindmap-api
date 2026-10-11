package io.github.brunocaffz.mindmap_api.shared.exception;

/**
 * O retorno do login não bate com o que iniciamos: state ausente, diferente do guardado na sessão,
 * ou sem code. Vira 400 Problem Details. A mensagem nunca repete o que veio na URL.
 */
public class InvalidOAuthStateException extends RuntimeException {

    public InvalidOAuthStateException() {
        super("Retorno de login inválido");
    }
}
