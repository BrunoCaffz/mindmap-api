package io.github.brunocaffz.mindmap_api.shared.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    private HttpClientErrorException notionError(HttpStatus status, HttpHeaders headers) {
        return HttpClientErrorException.create(status, status.getReasonPhrase(), headers, new byte[0], null);
    }

    @Test
    void pageNotSharedBecomes404() {
        ResponseEntity<ProblemDetail> res =
                handler.handleNotionClientError(notionError(HttpStatus.NOT_FOUND, new HttpHeaders()));

        assertEquals(404, res.getStatusCode().value());
    }

    @Test
    void rateLimitKeepsRetryAfterHeader() {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.RETRY_AFTER, "2");

        ResponseEntity<ProblemDetail> res =
                handler.handleNotionClientError(notionError(HttpStatus.TOO_MANY_REQUESTS, headers));

        assertEquals(429, res.getStatusCode().value());
        assertEquals("2", res.getHeaders().getFirst(HttpHeaders.RETRY_AFTER));
    }

    @Test
    void rejectedServerTokenIsNotExposedAsClientError() {
        ResponseEntity<ProblemDetail> res =
                handler.handleNotionClientError(notionError(HttpStatus.UNAUTHORIZED, new HttpHeaders()));

        assertEquals(502, res.getStatusCode().value());
    }

    @Test
    void unauthenticatedBecomes401() {
        ResponseEntity<ProblemDetail> res = handler.handleUnauthenticated(new UnauthenticatedException());

        assertEquals(401, res.getStatusCode().value());
        assertEquals("Login necessário", res.getBody().getTitle());
    }

    @Test
    void revokedNotionAccessBecomes401SoTheFrontAsksToLogInAgain() {
        ResponseEntity<ProblemDetail> res =
                handler.handleConnectionExpired(new NotionConnectionExpiredException());

        assertEquals(401, res.getStatusCode().value());
    }

    @Test
    void invalidOAuthStateBecomes400WithoutEchoingAnything() {
        ResponseEntity<ProblemDetail> res = handler.handleInvalidOAuthState(new InvalidOAuthStateException());

        assertEquals(400, res.getStatusCode().value());
    }

    @Test
    void codeRejectedByNotionBecomes400AndOurFailureBecomes502() {
        assertEquals(400, handler.handleOAuthExchange(new OAuthExchangeException("recusado", true))
                .getStatusCode().value());
        assertEquals(502, handler.handleOAuthExchange(new OAuthExchangeException("credenciais", false))
                .getStatusCode().value());
    }

    @Test
    void missingOAuthConfigurationBecomes503() {
        ResponseEntity<ProblemDetail> res = handler.handleOAuthNotConfigured(new OAuthNotConfiguredException());

        assertEquals(503, res.getStatusCode().value());
    }

    @Test
    void accessDeniedBecomes403() {
        ResponseEntity<ProblemDetail> res =
                handler.handleAccessDenied(new org.springframework.security.access.AccessDeniedException("csrf"));

        assertEquals(403, res.getStatusCode().value());
    }

    @Test
    void invalidPageIdBecomes400() {
        ResponseEntity<ProblemDetail> res =
                handler.handleInvalidPageId(new InvalidPageIdException("ID inválido"));

        assertEquals(400, res.getStatusCode().value());
    }
}
