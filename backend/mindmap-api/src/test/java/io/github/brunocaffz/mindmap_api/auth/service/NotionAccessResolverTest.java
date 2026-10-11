package io.github.brunocaffz.mindmap_api.auth.service;

import io.github.brunocaffz.mindmap_api.auth.NotionPrincipal;
import io.github.brunocaffz.mindmap_api.auth.config.AppProperties;
import io.github.brunocaffz.mindmap_api.auth.token.TokenStore;
import io.github.brunocaffz.mindmap_api.notion.config.NotionProperties;
import io.github.brunocaffz.mindmap_api.notion.service.NotionAccess;
import io.github.brunocaffz.mindmap_api.shared.exception.UnauthenticatedException;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class NotionAccessResolverTest {

    private static final NotionPrincipal ANA = new NotionPrincipal("user-1", "Ana", "ws-1", "Meu Workspace");

    private final TokenStore tokens = mock(TokenStore.class);

    private NotionAccessResolver resolver(boolean fallback, String personalToken) {
        AppProperties app = new AppProperties("http://localhost:3000", fallback, "");
        NotionProperties notion = new NotionProperties(personalToken, "2022-06-28", "https://api.notion.com/v1",
                new NotionProperties.Oauth("", "", "http://localhost:3000/api/auth/notion/callback"));
        return new NotionAccessResolver(tokens, app, notion);
    }

    @Test
    void loggedInUserGetsTheirOwnStoredToken() {
        when(tokens.find("user-1", "ws-1")).thenReturn(Optional.of("token-da-ana"));

        NotionAccess access = resolver(false, "token-pessoal").resolve(ANA);

        assertEquals("token-da-ana", access.token());
        assertTrue(access.userOwned());
    }

    @Test
    void loggedInUserNeverFallsBackToThePersonalToken() {
        // Mesmo com o fallback ligado, quem está logado sem token guardado não "herda" o token pessoal.
        when(tokens.find("user-1", "ws-1")).thenReturn(Optional.empty());

        assertThrows(UnauthenticatedException.class, () -> resolver(true, "token-pessoal").resolve(ANA));
    }

    @Test
    void anonymousWithFallbackOffIsRejected() {
        assertThrows(UnauthenticatedException.class, () -> resolver(false, "token-pessoal").resolve(null));
        verifyNoInteractions(tokens);
    }

    @Test
    void anonymousWithFallbackOnUsesThePersonalToken() {
        NotionAccess access = resolver(true, "token-pessoal").resolve(null);

        assertEquals("token-pessoal", access.token());
        assertFalse(access.userOwned());
    }

    @Test
    void anonymousWithFallbackOnButNoPersonalTokenIsRejected() {
        assertThrows(UnauthenticatedException.class, () -> resolver(true, "").resolve(null));
        assertThrows(UnauthenticatedException.class, () -> resolver(true, null).resolve(null));
    }

    @Test
    void accessToStringHidesTheToken() {
        assertFalse(new NotionAccess("token-secreto", true).toString().contains("token-secreto"));
    }
}
