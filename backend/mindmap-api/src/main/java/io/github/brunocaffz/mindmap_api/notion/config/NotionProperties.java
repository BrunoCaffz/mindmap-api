package io.github.brunocaffz.mindmap_api.notion.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Le do application.yml. {@code token} é o token pessoal, usado só como fallback de desenvolvimento
 * (app.dev-token-fallback). {@code oauth} guarda as credenciais da integração pública do Notion.
 * O toString esconde os segredos para eles não irem parar num log por acidente.
 */
@ConfigurationProperties(prefix = "notion")
public record NotionProperties(
        String token,
        @DefaultValue("2022-06-28") String version,
        @DefaultValue("https://api.notion.com/v1") String baseUrl,
        @DefaultValue Oauth oauth) {

    public record Oauth(
            String clientId,
            String clientSecret,
            @DefaultValue("http://localhost:3000/api/auth/notion/callback") String redirectUri) {

        public boolean configured() {
            return clientId != null && !clientId.isBlank() && clientSecret != null && !clientSecret.isBlank();
        }

        @Override
        public String toString() {
            return "Oauth[clientId=" + (clientId == null || clientId.isBlank() ? "<vazio>" : "<definido>")
                    + ", clientSecret=<oculto>, redirectUri=" + redirectUri + "]";
        }
    }

    @Override
    public String toString() {
        return "NotionProperties[token=<oculto>, version=" + version + ", baseUrl=" + baseUrl + ", oauth=" + oauth + "]";
    }
}
