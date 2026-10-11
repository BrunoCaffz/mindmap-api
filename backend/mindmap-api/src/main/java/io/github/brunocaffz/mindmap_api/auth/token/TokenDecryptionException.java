package io.github.brunocaffz.mindmap_api.auth.token;

/** Não foi possível descriptografar: chave diferente da usada ao gravar, dado alterado ou contexto errado. */
public class TokenDecryptionException extends RuntimeException {

    public TokenDecryptionException() {
        super("Não foi possível descriptografar o valor guardado");
    }
}
