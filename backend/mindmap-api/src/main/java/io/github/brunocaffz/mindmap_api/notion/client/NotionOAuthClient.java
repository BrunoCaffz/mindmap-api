package io.github.brunocaffz.mindmap_api.notion.client;

import io.github.brunocaffz.mindmap_api.notion.config.NotionProperties;
import io.github.brunocaffz.mindmap_api.shared.exception.OAuthExchangeException;
import io.github.brunocaffz.mindmap_api.shared.exception.OAuthNotConfiguredException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;
import tools.jackson.databind.JsonNode;

import java.net.URI;
import java.util.Map;

/**
 * Parte OAuth2 da API do Notion (Authorization Code). Fica em notion.client porque as chamadas HTTP ao
 * Notion moram só aqui. Nunca loga code, token nem segredo, e os erros não os carregam.
 */
@Component
public class NotionOAuthClient {
    private static final Logger log = LoggerFactory.getLogger(NotionOAuthClient.class);

    private static final int MAX_ID_LENGTH = 64;
    private static final int MAX_NAME_LENGTH = 200;

    private final NotionProperties.Oauth oauth;
    private final String baseUrl;
    private final RestClient http;

    @Autowired
    public NotionOAuthClient(NotionProperties props) {
        this(props, RestClient.builder());
    }

    // Os testes entregam um builder já ligado a um servidor falso.
    NotionOAuthClient(NotionProperties props, RestClient.Builder builder) {
        this.oauth = props.oauth();
        this.baseUrl = props.baseUrl();
        this.http = builder
                .baseUrl(props.baseUrl())
                .defaultHeader("Notion-Version", props.version())
                .build();
    }

    public boolean isConfigured() {
        return oauth.configured();
    }

    /** Endereço da tela de autorização do Notion. O state é o que o callback vai conferir depois. */
    public URI authorizationUri(String state) {
        requireConfigured();
        return UriComponentsBuilder.fromUriString(baseUrl + "/oauth/authorize")
                .queryParam("client_id", "{clientId}")
                .queryParam("response_type", "code")
                .queryParam("owner", "user")
                .queryParam("redirect_uri", "{redirectUri}")
                .queryParam("state", "{state}")
                .encode()
                .build(Map.of(
                        "clientId", oauth.clientId(),
                        "redirectUri", oauth.redirectUri(),
                        "state", state));
    }

    /** Troca o code por um token de acesso. Lança OAuthExchangeException se o Notion recusar. */
    public NotionGrant exchangeCode(String code) {
        requireConfigured();
        JsonNode res;
        try {
            res = http.post()
                    .uri("/oauth/token")
                    .headers(h -> h.setBasicAuth(oauth.clientId(), oauth.clientSecret()))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "grant_type", "authorization_code",
                            "code", code,
                            "redirect_uri", oauth.redirectUri()))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (HttpClientErrorException ex) {
            int status = ex.getStatusCode().value();
            // 400: code expirado ou já usado. Qualquer outro 4xx (401): credenciais da integração erradas, problema nosso.
            if (status == 400) {
                log.warn("Notion recusou o code do login (status 400)");
                throw new OAuthExchangeException("O Notion recusou o código de login", true);
            }
            log.error("Notion recusou a troca do code (status {}). Confira NOTION_CLIENT_ID e NOTION_CLIENT_SECRET", status);
            throw new OAuthExchangeException("O Notion recusou as credenciais da integração", false);
        }

        if (res == null) {
            throw new OAuthExchangeException("Resposta vazia do Notion na troca do code", false);
        }
        String accessToken = res.path("access_token").asText("");
        String workspaceId = res.path("workspace_id").asText("");
        String userId = res.path("owner").path("user").path("id").asText("");
        if (accessToken.isBlank() || workspaceId.isBlank() || userId.isBlank()
                || workspaceId.length() > MAX_ID_LENGTH || userId.length() > MAX_ID_LENGTH) {
            throw new OAuthExchangeException("Resposta do Notion fora do formato esperado", false);
        }
        return new NotionGrant(
                accessToken,
                workspaceId,
                limit(res.path("workspace_name").asText("")),
                userId,
                limit(res.path("owner").path("user").path("name").asText("")));
    }

    private void requireConfigured() {
        if (!oauth.configured()) {
            throw new OAuthNotConfiguredException();
        }
    }

    private static String limit(String value) {
        return value.length() > MAX_NAME_LENGTH ? value.substring(0, MAX_NAME_LENGTH) : value;
    }
}
