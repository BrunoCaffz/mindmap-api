package io.github.brunocaffz.mindmap_api.auth.controller;

import io.github.brunocaffz.mindmap_api.auth.NotionPrincipal;
import io.github.brunocaffz.mindmap_api.auth.config.SecurityConfig;
import io.github.brunocaffz.mindmap_api.auth.service.NotionLoginService;
import io.github.brunocaffz.mindmap_api.auth.service.OAuthStateStore;
import io.github.brunocaffz.mindmap_api.notion.client.NotionOAuthClient;
import io.github.brunocaffz.mindmap_api.shared.exception.OAuthExchangeException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Fluxo de login e logout pela cadeia de segurança real. O Notion nunca é chamado: o cliente OAuth e o
 * serviço de login são simulados.
 */
@WebMvcTest(controllers = {AuthController.class, MeController.class})
@Import({SecurityConfig.class, OAuthStateStore.class})
class AuthControllerTest {

    private static final NotionPrincipal ANA = new NotionPrincipal("user-1", "Ana", "ws-1", "Meu Workspace");

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private NotionOAuthClient oauth;

    @MockitoBean
    private NotionLoginService loginService;

    @BeforeEach
    void setUp() {
        when(oauth.isConfigured()).thenReturn(true);
        when(oauth.authorizationUri(anyString())).thenAnswer(inv ->
                URI.create("https://api.notion.com/v1/oauth/authorize?state=" + inv.getArgument(0)));
    }

    /** Faz o primeiro passo do login e devolve a sessão e o state que saiu para o Notion. */
    private record Started(MockHttpSession session, String state) {}

    private Started startLogin() throws Exception {
        MvcResult result = mvc.perform(get("/api/auth/notion/login")).andExpect(status().isFound()).andReturn();
        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertNotNull(session, "o login precisa criar a sessão que guarda o state");
        String state = UriComponentsBuilder.fromUriString(result.getResponse().getHeader("Location"))
                .build().getQueryParams().getFirst("state");
        return new Started(session, state);
    }

    // ---------- passo 1: ir para o Notion ----------

    @Test
    void loginRedirectsToNotionWithAFreshRandomState() throws Exception {
        Started first = startLogin();
        Started second = startLogin();

        assertNotNull(first.state());
        assertTrue(first.state().length() >= 40, "state aleatório com 32 bytes");
        assertNotEquals(first.state(), second.state());
    }

    @Test
    void loginWithoutOAuthCredentialsReturns503ProblemDetails() throws Exception {
        when(oauth.isConfigured()).thenReturn(false);

        mvc.perform(get("/api/auth/notion/login"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(503));
    }

    // ---------- passo 2: callback com state inválido ----------

    @Test
    void callbackWithoutAnySessionReturns400ProblemDetails() throws Exception {
        mvc.perform(get("/api/auth/notion/callback").param("code", "c").param("state", "qualquer"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.title").value("Login inválido"));

        verifyNoInteractions(loginService);
    }

    @Test
    void callbackWithWrongStateReturns400AndNeverExchangesTheCode() throws Exception {
        Started started = startLogin();

        mvc.perform(get("/api/auth/notion/callback").session(started.session())
                        .param("code", "codigo-secreto-123").param("state", "state-forjado"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(400))
                // Nada do que veio na URL volta na resposta.
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("codigo-secreto-123"))))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("state-forjado"))));

        verify(loginService, never()).login(anyString());
    }

    @Test
    void callbackWithoutStateParameterReturns400() throws Exception {
        Started started = startLogin();

        mvc.perform(get("/api/auth/notion/callback").session(started.session()).param("code", "c"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        verifyNoInteractions(loginService);
    }

    @Test
    void stateWorksOnlyOnce() throws Exception {
        Started started = startLogin();
        when(loginService.login("c")).thenReturn(ANA);

        mvc.perform(get("/api/auth/notion/callback").session(started.session())
                        .param("code", "c").param("state", started.state()))
                .andExpect(status().isFound());

        // O mesmo retorno, repetido (replay), não passa de novo.
        mvc.perform(get("/api/auth/notion/callback").session(started.session())
                        .param("code", "c").param("state", started.state()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void aWrongStateBurnsTheStoredOne() throws Exception {
        Started started = startLogin();

        mvc.perform(get("/api/auth/notion/callback").session(started.session())
                        .param("code", "c").param("state", "errado"))
                .andExpect(status().isBadRequest());
        // Mesmo com o state certo depois, o guardado já foi descartado.
        mvc.perform(get("/api/auth/notion/callback").session(started.session())
                        .param("code", "c").param("state", started.state()))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(loginService);
    }

    // ---------- passo 2: callback válido ----------

    @Test
    void validCallbackLogsInChangesTheSessionIdAndRedirectsToTheFront() throws Exception {
        Started started = startLogin();
        String idBefore = started.session().getId();
        when(loginService.login("codigo-1")).thenReturn(ANA);

        MvcResult result = mvc.perform(get("/api/auth/notion/callback").session(started.session())
                        .param("code", "codigo-1").param("state", started.state()))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "http://localhost:3000"))
                .andReturn();

        MockHttpSession after = (MockHttpSession) result.getRequest().getSession(false);
        assertNotNull(after);
        assertNotEquals(idBefore, after.getId(), "o id da sessão tem que mudar ao autenticar (session fixation)");

        // Com a sessão nova, o usuário está logado e /api/me mostra só os nomes.
        mvc.perform(get("/api/me").session(after))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userName").value("Ana"))
                .andExpect(jsonPath("$.workspaceName").value("Meu Workspace"));
    }

    @Test
    void personWhoDeniedAccessIsSentBackWithoutExchangingAnything() throws Exception {
        Started started = startLogin();

        mvc.perform(get("/api/auth/notion/callback").session(started.session())
                        .param("error", "access_denied").param("state", started.state()))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "http://localhost:3000?login_error=denied"));

        verifyNoInteractions(loginService);
    }

    @Test
    void errorParameterWithAWrongStateIsStillRejected() throws Exception {
        Started started = startLogin();

        mvc.perform(get("/api/auth/notion/callback").session(started.session())
                        .param("error", "access_denied").param("state", "forjado"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void codeRejectedByNotionReturns400AndLeavesNobodyLoggedIn() throws Exception {
        Started started = startLogin();
        when(loginService.login("velho")).thenThrow(new OAuthExchangeException("recusado", true));

        MvcResult result = mvc.perform(get("/api/auth/notion/callback").session(started.session())
                        .param("code", "velho").param("state", started.state()))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andReturn();

        mvc.perform(get("/api/me").session((MockHttpSession) result.getRequest().getSession(false)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void integrationProblemOnOurSideReturns502() throws Exception {
        Started started = startLogin();
        when(loginService.login("c")).thenThrow(new OAuthExchangeException("credenciais", false));

        mvc.perform(get("/api/auth/notion/callback").session(started.session())
                        .param("code", "c").param("state", started.state()))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.status").value(502));
    }

    // ---------- logout ----------

    private UsernamePasswordAuthenticationToken loggedIn() {
        return UsernamePasswordAuthenticationToken.authenticated(ANA, null, AuthorityUtils.createAuthorityList("ROLE_USER"));
    }

    @Test
    void logoutWithoutCsrfTokenIsRejected() throws Exception {
        mvc.perform(post("/api/auth/logout").with(authentication(loggedIn())))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void logoutWithCsrfEndsTheSessionAndClearsTheCookie() throws Exception {
        MockHttpSession session = new MockHttpSession();

        mvc.perform(post("/api/auth/logout").session(session).with(authentication(loggedIn())).with(csrf()))
                .andExpect(status().isNoContent())
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("Max-Age=0")))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("MINDMAP_SESSION=")));

        assertTrue(session.isInvalid(), "a sessão no servidor tem que ser invalidada");
    }

    @Test
    void logoutByGetIsNotAvailable() throws Exception {
        MvcResult result = mvc.perform(get("/api/auth/logout")).andReturn();

        assertTrue(result.getResponse().getStatus() >= 400, "logout não pode ser feito por GET");
        assertEquals(0, result.getResponse().getHeaders("Set-Cookie").stream()
                .filter(h -> h.contains("Max-Age=0")).count());
    }
}
