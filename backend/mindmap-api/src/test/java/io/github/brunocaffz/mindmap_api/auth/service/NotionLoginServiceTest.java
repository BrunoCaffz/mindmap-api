package io.github.brunocaffz.mindmap_api.auth.service;

import io.github.brunocaffz.mindmap_api.auth.NotionPrincipal;
import io.github.brunocaffz.mindmap_api.auth.token.TokenStore;
import io.github.brunocaffz.mindmap_api.notion.client.NotionGrant;
import io.github.brunocaffz.mindmap_api.notion.client.NotionOAuthClient;
import io.github.brunocaffz.mindmap_api.shared.exception.OAuthExchangeException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class NotionLoginServiceTest {

    private final NotionOAuthClient oauth = mock(NotionOAuthClient.class);
    private final TokenStore tokens = mock(TokenStore.class);
    private final NotionLoginService service = new NotionLoginService(oauth, tokens);

    @Test
    void storesTheTokenAndReturnsAPrincipalWithoutIt() {
        when(oauth.exchangeCode("codigo")).thenReturn(
                new NotionGrant("token-secreto-do-usuario", "ws-1", "Meu Workspace", "user-1", "Ana"));

        NotionPrincipal principal = service.login("codigo");

        verify(tokens).save("user-1", "ws-1", "token-secreto-do-usuario");
        assertEquals(new NotionPrincipal("user-1", "Ana", "ws-1", "Meu Workspace"), principal);
        assertFalse(principal.toString().contains("token-secreto-do-usuario"));
    }

    @Test
    void missingNamesGetFriendlyDefaults() {
        when(oauth.exchangeCode("codigo")).thenReturn(new NotionGrant("tok", "ws-1", "", "user-1", null));

        NotionPrincipal principal = service.login("codigo");

        assertEquals("Usuário do Notion", principal.userName());
        assertEquals("Workspace", principal.workspaceName());
    }

    @Test
    void failedExchangeStoresNothing() {
        when(oauth.exchangeCode("velho")).thenThrow(new OAuthExchangeException("recusado", true));

        assertThrows(OAuthExchangeException.class, () -> service.login("velho"));

        verifyNoInteractions(tokens);
    }
}
