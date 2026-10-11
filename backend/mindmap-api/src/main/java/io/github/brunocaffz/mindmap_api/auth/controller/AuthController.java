package io.github.brunocaffz.mindmap_api.auth.controller;

import io.github.brunocaffz.mindmap_api.auth.NotionPrincipal;
import io.github.brunocaffz.mindmap_api.auth.config.AppProperties;
import io.github.brunocaffz.mindmap_api.auth.service.NotionLoginService;
import io.github.brunocaffz.mindmap_api.auth.service.OAuthStateStore;
import io.github.brunocaffz.mindmap_api.notion.client.NotionOAuthClient;
import io.github.brunocaffz.mindmap_api.shared.exception.InvalidOAuthStateException;
import io.github.brunocaffz.mindmap_api.shared.exception.OAuthNotConfiguredException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

/**
 * Login com o Notion (OAuth2, Authorization Code). O logout (POST /api/auth/logout) é do Spring Security,
 * configurado em SecurityConfig, para o CSRF valer nele.
 */
@RestController
@RequestMapping("/api/auth/notion")
public class AuthController {

    private final NotionOAuthClient oauth;
    private final OAuthStateStore states;
    private final NotionLoginService loginService;
    private final SecurityContextRepository securityContextRepository;
    private final AppProperties app;
    private final SecurityContextHolderStrategy contextHolder = SecurityContextHolder.getContextHolderStrategy();

    public AuthController(NotionOAuthClient oauth,
                          OAuthStateStore states,
                          NotionLoginService loginService,
                          SecurityContextRepository securityContextRepository,
                          AppProperties app) {
        this.oauth = oauth;
        this.states = states;
        this.loginService = loginService;
        this.securityContextRepository = securityContextRepository;
        this.app = app;
    }

    @GetMapping("/login")
    public ResponseEntity<Void> login(HttpServletRequest request) {
        if (!oauth.isConfigured()) {
            throw new OAuthNotConfiguredException();
        }
        String state = states.issue(request.getSession(true));
        return redirect(oauth.authorizationUri(state));
    }

    @GetMapping("/callback")
    public ResponseEntity<Void> callback(@RequestParam(required = false) String code,
                                         @RequestParam(required = false) String state,
                                         @RequestParam(required = false) String error,
                                         HttpServletRequest request,
                                         HttpServletResponse response) {
        // getSession(false): quem chega aqui sem sessão não iniciou o login por nós, não criamos uma.
        HttpSession session = request.getSession(false);
        if (!states.consume(session, state)) {
            throw new InvalidOAuthStateException();
        }

        // A pessoa recusou na tela do Notion. O state já foi conferido, então é um retorno legítimo.
        if (error != null && !error.isBlank()) {
            return redirect(frontendUrl("login_error", "access_denied".equals(error) ? "denied" : "failed"));
        }
        if (code == null || code.isBlank()) {
            throw new InvalidOAuthStateException();
        }

        NotionPrincipal principal = loginService.login(code);

        // Novo id de sessão ANTES de autenticar: um id plantado antes do login (session fixation) não serve.
        request.changeSessionId();
        authenticate(principal, request, response);

        return redirect(frontendUrl(null, null));
    }

    private void authenticate(NotionPrincipal principal, HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(
                principal, null, AuthorityUtils.createAuthorityList("ROLE_USER"));
        SecurityContext context = contextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        contextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
    }

    private URI frontendUrl(String param, String value) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(app.frontendUrl());
        if (param != null) {
            builder.queryParam(param, value);
        }
        return builder.build().toUri();
    }

    private static ResponseEntity<Void> redirect(URI target) {
        return ResponseEntity.status(HttpStatus.FOUND).location(target).build();
    }
}
