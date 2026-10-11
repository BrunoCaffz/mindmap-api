package io.github.brunocaffz.mindmap_api.auth.token;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;

/** Guarda e lê o token do Notion de cada usuário, sempre criptografado em repouso. */
@Service
public class TokenStore {
    private static final Logger log = LoggerFactory.getLogger(TokenStore.class);

    private final TokenRepository repository;
    private final TokenCipher cipher;

    public TokenStore(TokenRepository repository, TokenCipher cipher) {
        this.repository = repository;
        this.cipher = cipher;
    }

    public void save(String userId, String workspaceId, String accessToken) {
        repository.upsert(userId, workspaceId, cipher.encrypt(accessToken, context(userId, workspaceId)));
    }

    /** Vazio se não há token ou se ele não pôde ser lido (chave trocada ou dado alterado). */
    public Optional<String> find(String userId, String workspaceId) {
        return repository.find(userId, workspaceId).flatMap(encrypted -> {
            try {
                return Optional.of(cipher.decrypt(encrypted, context(userId, workspaceId)));
            } catch (TokenDecryptionException ex) {
                // Sem ids nem conteúdo no log. Quem sabe disso é quem tem o banco e a chave.
                log.warn("Um token guardado não pôde ser descriptografado (chave trocada ou dado alterado?)");
                return Optional.empty();
            }
        });
    }

    private static String context(String userId, String workspaceId) {
        return userId + "|" + workspaceId;
    }
}
