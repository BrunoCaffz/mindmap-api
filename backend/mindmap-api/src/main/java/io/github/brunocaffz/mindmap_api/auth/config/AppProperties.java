package io.github.brunocaffz.mindmap_api.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.net.URI;

/**
 * Configuração do app. {@code tokenEncryptionKey} é a chave AES-256 (base64) que protege os tokens do
 * Notion no banco: vem do ambiente e é validada pelo TokenCipher na inicialização. O toString a esconde.
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        @DefaultValue("http://localhost:3000") String frontendUrl,
        @DefaultValue("false") boolean devTokenFallback,
        String tokenEncryptionKey) {

    public AppProperties {
        URI uri;
        try {
            uri = URI.create(frontendUrl);
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("app.frontend-url precisa ser uma URL http ou https válida");
        }
        String scheme = uri.getScheme();
        if (uri.getHost() == null || !("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))) {
            throw new IllegalStateException("app.frontend-url precisa ser uma URL http ou https válida");
        }
    }

    @Override
    public String toString() {
        return "AppProperties[frontendUrl=" + frontendUrl + ", devTokenFallback=" + devTokenFallback
                + ", tokenEncryptionKey=<oculta>]";
    }
}
