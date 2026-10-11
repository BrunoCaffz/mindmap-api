package io.github.brunocaffz.mindmap_api.auth.token;

import io.github.brunocaffz.mindmap_api.auth.config.AppProperties;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

/**
 * Criptografia em repouso dos tokens do Notion: AES-256-GCM com nonce aleatório de 96 bits por
 * registro. O valor devolvido é {@code nonce || texto cifrado || tag}. O GCM autentica o conteúdo: se
 * alguém alterar o dado no banco, a leitura falha em vez de devolver lixo.
 *
 * <p>O {@code context} entra como dado associado autenticado (AAD). Usamos "usuário|workspace", então
 * um valor copiado para a linha de outro usuário não descriptografa.
 *
 * <p>A chave vem de TOKEN_ENCRYPTION_KEY (base64 de 32 bytes). Se faltar ou for inválida, o app não
 * sobe. Nenhuma mensagem de erro desta classe contém a chave nem o texto em claro.
 */
@Component
public class TokenCipher {

    private static final int KEY_BYTES = 32;
    private static final int NONCE_BYTES = 12;
    private static final int TAG_BITS = 128;
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";

    private final SecretKeySpec key;
    private final SecureRandom random = new SecureRandom();

    public TokenCipher(AppProperties props) {
        this.key = parseKey(props.tokenEncryptionKey());
    }

    private static SecretKeySpec parseKey(String base64) {
        String hint = "TOKEN_ENCRYPTION_KEY precisa ser uma chave de 32 bytes em base64 (gere com: openssl rand -base64 32)";
        if (base64 == null || base64.isBlank()) {
            throw new IllegalStateException("TOKEN_ENCRYPTION_KEY ausente. " + hint);
        }
        byte[] raw;
        try {
            raw = Base64.getDecoder().decode(base64.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("TOKEN_ENCRYPTION_KEY inválida (não é base64). " + hint);
        }
        try {
            if (raw.length != KEY_BYTES) {
                throw new IllegalStateException("TOKEN_ENCRYPTION_KEY inválida (tamanho errado). " + hint);
            }
            return new SecretKeySpec(raw, "AES");
        } finally {
            Arrays.fill(raw, (byte) 0);
        }
    }

    public byte[] encrypt(String plaintext, String context) {
        byte[] nonce = new byte[NONCE_BYTES];
        random.nextBytes(nonce);
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, nonce));
            cipher.updateAAD(context.getBytes(StandardCharsets.UTF_8));
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            byte[] out = new byte[NONCE_BYTES + encrypted.length];
            System.arraycopy(nonce, 0, out, 0, NONCE_BYTES);
            System.arraycopy(encrypted, 0, out, NONCE_BYTES, encrypted.length);
            return out;
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Falha ao criptografar");
        }
    }

    public String decrypt(byte[] payload, String context) {
        if (payload == null || payload.length <= NONCE_BYTES) {
            throw new TokenDecryptionException();
        }
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, payload, 0, NONCE_BYTES));
            cipher.updateAAD(context.getBytes(StandardCharsets.UTF_8));
            byte[] plain = cipher.doFinal(payload, NONCE_BYTES, payload.length - NONCE_BYTES);
            return new String(plain, StandardCharsets.UTF_8);
        } catch (GeneralSecurityException ex) {
            throw new TokenDecryptionException();
        }
    }
}
