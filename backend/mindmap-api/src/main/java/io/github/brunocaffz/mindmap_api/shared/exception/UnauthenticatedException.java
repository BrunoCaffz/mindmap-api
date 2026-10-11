package io.github.brunocaffz.mindmap_api.shared.exception;

/** Não há usuário logado (ou o token dele não está mais disponível). Vira 401 Problem Details. */
public class UnauthenticatedException extends RuntimeException {

    public UnauthenticatedException() {
        super("Login necessário");
    }
}
