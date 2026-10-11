package io.github.brunocaffz.mindmap_api.auth.service;

import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * O parâmetro state do OAuth2: um valor aleatório que sai com o redirecionamento ao Notion e precisa
 * voltar igual. Guardado na sessão, vale uma vez só. Protege o callback contra login forjado (CSRF).
 */
@Component
public class OAuthStateStore {

    static final String ATTRIBUTE = "notion.oauth.state";
    private static final int STATE_BYTES = 32;

    private final SecureRandom random = new SecureRandom();

    public String issue(HttpSession session) {
        byte[] bytes = new byte[STATE_BYTES];
        random.nextBytes(bytes);
        String state = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        session.setAttribute(ATTRIBUTE, state);
        return state;
    }

    /**
     * Confere e descarta o state. Sempre remove o guardado, para um state não valer duas vezes, mesmo
     * quando a conferência falha.
     */
    public boolean consume(HttpSession session, String received) {
        if (session == null) {
            return false;
        }
        Object expected = session.getAttribute(ATTRIBUTE);
        session.removeAttribute(ATTRIBUTE);
        if (!(expected instanceof String expectedState) || received == null || received.isBlank()) {
            return false;
        }
        return MessageDigest.isEqual(
                expectedState.getBytes(StandardCharsets.UTF_8),
                received.getBytes(StandardCharsets.UTF_8));
    }
}
