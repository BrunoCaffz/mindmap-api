package io.github.brunocaffz.mindmap_api.shared.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Traduz falhas em respostas no formato Problem Details (RFC 9457).
 * Estende ResponseEntityExceptionHandler para manter o tratamento padrão
 * dos erros do próprio Spring MVC (rota inexistente, método errado etc.).
 * Nada do corpo de resposta do Notion é repassado ao cliente.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(InvalidPageIdException.class)
    public ResponseEntity<ProblemDetail> handleInvalidPageId(InvalidPageIdException ex) {
        return respond(HttpStatus.BAD_REQUEST, "ID de página inválido", ex.getMessage(), null);
    }

    @ExceptionHandler(HttpClientErrorException.class)
    public ResponseEntity<ProblemDetail> handleNotionClientError(HttpClientErrorException ex) {
        int status = ex.getStatusCode().value();
        log.warn("Notion API respondeu {}", status);

        return switch (status) {
            case 400 -> respond(HttpStatus.BAD_REQUEST, "Pedido inválido",
                    "O Notion não aceitou esse ID de página.", null);
            case 404 -> respond(HttpStatus.NOT_FOUND, "Página não encontrada",
                    "A página não existe ou o token não tem acesso a ela.", null);
            case 429 -> respond(HttpStatus.TOO_MANY_REQUESTS, "Muitas requisições",
                    "O Notion limitou as requisições. Tente de novo em alguns segundos.", retryAfter(ex));
            case 401, 403 -> {
                log.error("Notion recusou o token do servidor (status {})", status);
                yield respond(HttpStatus.BAD_GATEWAY, "Falha ao acessar o Notion",
                        "O servidor não conseguiu se autenticar no Notion.", null);
            }
            default -> respond(HttpStatus.BAD_GATEWAY, "Falha ao acessar o Notion",
                    "Resposta inesperada do Notion.", null);
        };
    }

    @ExceptionHandler(HttpServerErrorException.class)
    public ResponseEntity<ProblemDetail> handleNotionServerError(HttpServerErrorException ex) {
        log.error("Notion API com erro {}", ex.getStatusCode().value());
        return respond(HttpStatus.BAD_GATEWAY, "Notion indisponível",
                "O Notion falhou ao responder. Tente novamente em instantes.", null);
    }

    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<ProblemDetail> handleNetworkFailure(ResourceAccessException ex) {
        log.error("Falha de rede ao falar com o Notion", ex);
        return respond(HttpStatus.GATEWAY_TIMEOUT, "Notion não respondeu",
                "Não foi possível falar com o Notion agora.", null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(Exception ex) {
        log.error("Erro inesperado", ex);
        return respond(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno",
                "Algo deu errado do nosso lado.", null);
    }

    private ResponseEntity<ProblemDetail> respond(HttpStatus status, String title, String detail, String retryAfter) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(title);

        ResponseEntity.BodyBuilder builder = ResponseEntity.status(status);
        if (retryAfter != null) {
            builder.header(HttpHeaders.RETRY_AFTER, retryAfter);
        }
        return builder.body(problem);
    }

    private String retryAfter(HttpClientErrorException ex) {
        HttpHeaders headers = ex.getResponseHeaders();
        return headers == null ? null : headers.getFirst(HttpHeaders.RETRY_AFTER);
    }
}
