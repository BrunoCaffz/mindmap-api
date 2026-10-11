package io.github.brunocaffz.mindmap_api.notion.client;

import io.github.brunocaffz.mindmap_api.notion.config.NotionProperties;
import io.github.brunocaffz.mindmap_api.shared.exception.OAuthExchangeException;
import io.github.brunocaffz.mindmap_api.shared.exception.OAuthNotConfiguredException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/** Fala só com um servidor falso: o Notion de verdade nunca é chamado. */
class NotionOAuthClientTest {

    private static final String BASE = "https://api.notion.com/v1";
    private static final String REDIRECT = "http://localhost:3000/api/auth/notion/callback";

    private MockRestServiceServer server;
    private NotionOAuthClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        NotionProperties props = new NotionProperties(null, "2022-06-28", BASE,
                new NotionProperties.Oauth("id-de-teste", "segredo-de-teste", REDIRECT));
        client = new NotionOAuthClient(props, builder);
    }

    @Test
    void authorizationUriCarriesTheOAuthParameters() {
        URI uri = client.authorizationUri("state-123");

        assertEquals("https://api.notion.com/v1/oauth/authorize", uri.getScheme() + "://" + uri.getHost() + uri.getPath());
        var params = UriComponentsBuilder.fromUri(uri).build().getQueryParams();
        assertEquals("id-de-teste", params.getFirst("client_id"));
        assertEquals("code", params.getFirst("response_type"));
        assertEquals("user", params.getFirst("owner"));
        assertEquals("state-123", params.getFirst("state"));
        // O redirect_uri vai codificado, para não ser lido como parte da URL do Notion.
        assertTrue(uri.getRawQuery().contains("redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fnotion%2Fcallback"));
    }

    @Test
    void exchangeSendsBasicAuthAndTheAuthorizationCodeGrant() {
        String basic = Base64.getEncoder().encodeToString("id-de-teste:segredo-de-teste".getBytes(StandardCharsets.UTF_8));
        server.expect(requestTo(BASE + "/oauth/token"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Basic " + basic))
                .andExpect(jsonPath("$.grant_type").value("authorization_code"))
                .andExpect(jsonPath("$.code").value("codigo-123"))
                .andExpect(jsonPath("$.redirect_uri").value(REDIRECT))
                .andRespond(withSuccess("""
                        {"access_token":"tok-abc","token_type":"bearer","bot_id":"b1",
                         "workspace_id":"ws-1","workspace_name":"Meu Workspace",
                         "owner":{"type":"user","user":{"object":"user","id":"user-1","name":"Ana"}}}
                        """, MediaType.APPLICATION_JSON));

        NotionGrant grant = client.exchangeCode("codigo-123");

        assertEquals("tok-abc", grant.accessToken());
        assertEquals("ws-1", grant.workspaceId());
        assertEquals("Meu Workspace", grant.workspaceName());
        assertEquals("user-1", grant.userId());
        assertEquals("Ana", grant.userName());
        assertFalse(grant.toString().contains("tok-abc"), "o token não pode sair no toString");
        server.verify();
    }

    @Test
    void codeRejectedByNotionIsAClientSideFailure() {
        server.expect(requestTo(BASE + "/oauth/token"))
                .andRespond(withStatus(HttpStatus.BAD_REQUEST).contentType(MediaType.APPLICATION_JSON)
                        .body("{\"error\":\"invalid_grant\"}"));

        OAuthExchangeException ex = assertThrows(OAuthExchangeException.class, () -> client.exchangeCode("velho"));

        assertTrue(ex.isRejectedByNotion());
        assertFalse(ex.getMessage().contains("velho"), "a mensagem não pode repetir o code");
    }

    @Test
    void wrongIntegrationCredentialsAreOurProblem() {
        server.expect(requestTo(BASE + "/oauth/token"))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED).contentType(MediaType.APPLICATION_JSON)
                        .body("{\"error\":\"unauthorized\"}"));

        OAuthExchangeException ex = assertThrows(OAuthExchangeException.class, () -> client.exchangeCode("codigo"));

        assertFalse(ex.isRejectedByNotion());
        assertFalse(ex.getMessage().contains("segredo-de-teste"));
    }

    @Test
    void responseWithoutTokenOrUserIsRejected() {
        server.expect(requestTo(BASE + "/oauth/token"))
                .andRespond(withSuccess("{\"workspace_id\":\"ws-1\"}", MediaType.APPLICATION_JSON));

        OAuthExchangeException ex = assertThrows(OAuthExchangeException.class, () -> client.exchangeCode("codigo"));

        assertFalse(ex.isRejectedByNotion());
    }

    @Test
    void withoutCredentialsNothingIsSent() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer empty = MockRestServiceServer.bindTo(builder).build();
        NotionProperties props = new NotionProperties(null, "2022-06-28", BASE,
                new NotionProperties.Oauth("", "", REDIRECT));
        NotionOAuthClient unconfigured = new NotionOAuthClient(props, builder);

        assertFalse(unconfigured.isConfigured());
        assertThrows(OAuthNotConfiguredException.class, () -> unconfigured.authorizationUri("s"));
        assertThrows(OAuthNotConfiguredException.class, () -> unconfigured.exchangeCode("c"));
        empty.verify(); // nenhuma requisição foi feita
    }

    @Test
    void propertiesToStringHidesTheSecret() {
        NotionProperties props = new NotionProperties("token-pessoal", "2022-06-28", BASE,
                new NotionProperties.Oauth("id-de-teste", "segredo-de-teste", REDIRECT));

        assertFalse(props.toString().contains("token-pessoal"));
        assertFalse(props.toString().contains("segredo-de-teste"));
    }
}
