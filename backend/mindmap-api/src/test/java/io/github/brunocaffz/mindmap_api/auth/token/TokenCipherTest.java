package io.github.brunocaffz.mindmap_api.auth.token;

import io.github.brunocaffz.mindmap_api.auth.config.AppProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TokenCipherTest {

    private static final String CONTEXT = "user-1|workspace-1";
    private static final String TOKEN = "token-de-teste-do-notion";

    // A chave é gerada a cada execução: nenhuma chave, nem falsa, fica escrita no repositório.
    private static String randomKey(int bytes) {
        byte[] key = new byte[bytes];
        new SecureRandom().nextBytes(key);
        return Base64.getEncoder().encodeToString(key);
    }

    private static TokenCipher cipherWith(String base64Key) {
        return new TokenCipher(new AppProperties("http://localhost:3000", false, base64Key));
    }

    @Test
    void roundTripReturnsTheOriginalText() {
        TokenCipher cipher = cipherWith(randomKey(32));

        byte[] encrypted = cipher.encrypt(TOKEN, CONTEXT);

        assertEquals(TOKEN, cipher.decrypt(encrypted, CONTEXT));
    }

    @Test
    void roundTripKeepsAccentsAndLongValues() {
        TokenCipher cipher = cipherWith(randomKey(32));
        String text = "ação-ç-€-" + "x".repeat(2000);

        assertEquals(text, cipher.decrypt(cipher.encrypt(text, CONTEXT), CONTEXT));
    }

    @Test
    void sameTextEncryptsToDifferentBytesEveryTime() {
        TokenCipher cipher = cipherWith(randomKey(32));

        byte[] first = cipher.encrypt(TOKEN, CONTEXT);
        byte[] second = cipher.encrypt(TOKEN, CONTEXT);

        assertFalse(Arrays.equals(first, second), "o resultado inteiro tem que mudar");
        assertFalse(Arrays.equals(Arrays.copyOfRange(first, 0, 12), Arrays.copyOfRange(second, 0, 12)),
                "o nonce (primeiros 12 bytes) tem que mudar");
        assertEquals(TOKEN, cipher.decrypt(first, CONTEXT));
        assertEquals(TOKEN, cipher.decrypt(second, CONTEXT));
    }

    @Test
    void encryptedValueDoesNotContainThePlainText() {
        byte[] encrypted = cipherWith(randomKey(32)).encrypt(TOKEN, CONTEXT);

        assertFalse(new String(encrypted, java.nio.charset.StandardCharsets.ISO_8859_1).contains(TOKEN));
    }

    @Test
    void anotherKeyCannotDecrypt() {
        byte[] encrypted = cipherWith(randomKey(32)).encrypt(TOKEN, CONTEXT);

        assertThrows(TokenDecryptionException.class, () -> cipherWith(randomKey(32)).decrypt(encrypted, CONTEXT));
    }

    @Test
    void alteredBytesAreDetected() {
        TokenCipher cipher = cipherWith(randomKey(32));
        byte[] encrypted = cipher.encrypt(TOKEN, CONTEXT);
        encrypted[encrypted.length - 1] ^= 0x01;

        assertThrows(TokenDecryptionException.class, () -> cipher.decrypt(encrypted, CONTEXT));
    }

    @Test
    void valueCopiedToAnotherUserDoesNotDecrypt() {
        TokenCipher cipher = cipherWith(randomKey(32));
        byte[] encrypted = cipher.encrypt(TOKEN, "user-1|workspace-1");

        assertThrows(TokenDecryptionException.class, () -> cipher.decrypt(encrypted, "user-2|workspace-1"));
    }

    @Test
    void tooShortPayloadFails() {
        TokenCipher cipher = cipherWith(randomKey(32));

        assertThrows(TokenDecryptionException.class, () -> cipher.decrypt(new byte[5], CONTEXT));
        assertThrows(TokenDecryptionException.class, () -> cipher.decrypt(null, CONTEXT));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "isto não é base64!", "abc"})
    void missingOrMalformedKeyFailsAtStartup(String key) {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> cipherWith(key));

        assertTrue(ex.getMessage().contains("TOKEN_ENCRYPTION_KEY"));
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 16, 24, 31, 33, 64})
    void keyWithWrongSizeFailsAtStartup(int bytes) {
        String key = randomKey(bytes);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> cipherWith(key));

        assertTrue(ex.getMessage().contains("TOKEN_ENCRYPTION_KEY"));
        assertFalse(ex.getMessage().contains(key), "a mensagem de erro não pode repetir a chave");
    }

    @Test
    void validKeyDoesNotAppearInPropertiesToString() {
        String key = randomKey(32);
        AppProperties props = new AppProperties("http://localhost:3000", false, key);

        assertFalse(props.toString().contains(key));
    }

    @Test
    void emptyTextStillRoundTrips() {
        TokenCipher cipher = cipherWith(randomKey(32));
        byte[] encrypted = cipher.encrypt("", CONTEXT);

        assertEquals("", cipher.decrypt(encrypted, CONTEXT));
        assertNotEquals(0, encrypted.length, "mesmo vazio, o resultado tem nonce e tag");
    }
}
