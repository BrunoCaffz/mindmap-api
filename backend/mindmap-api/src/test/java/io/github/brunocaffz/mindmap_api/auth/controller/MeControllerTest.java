package io.github.brunocaffz.mindmap_api.auth.controller;

import io.github.brunocaffz.mindmap_api.auth.NotionPrincipal;
import io.github.brunocaffz.mindmap_api.auth.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = MeController.class)
@Import(SecurityConfig.class)
class MeControllerTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void withoutSessionReturns401ProblemDetails() throws Exception {
        MvcResult result = mvc.perform(get("/api/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.title").value("Login necessário"))
                .andReturn();

        // Pedido anônimo não cria sessão: o único cookie que sai é o XSRF-TOKEN, que o front lê para o logout.
        assertNull(result.getRequest().getSession(false), "não pode criar sessão para quem não está logado");
        List<String> cookies = result.getResponse().getHeaders("Set-Cookie");
        assertTrue(cookies.stream().noneMatch(c -> c.startsWith("MINDMAP_SESSION")), "sem cookie de sessão");
        String csrf = cookies.stream().filter(c -> c.startsWith("XSRF-TOKEN=")).findFirst().orElseThrow();
        // O SameSite do cookie é conferido no teste de fumaça com o Tomcat real: o MockHttpServletResponse não o escreve.
        assertFalse(csrf.contains("HttpOnly"), "o front precisa conseguir ler o cookie CSRF");
    }

    @Test
    void loggedInReturnsOnlyTheNames() throws Exception {
        NotionPrincipal ana = new NotionPrincipal("user-id-123", "Ana", "workspace-id-456", "Meu Workspace");
        var auth = UsernamePasswordAuthenticationToken.authenticated(
                ana, null, AuthorityUtils.createAuthorityList("ROLE_USER"));

        mvc.perform(get("/api/me").with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userName").value("Ana"))
                .andExpect(jsonPath("$.workspaceName").value("Meu Workspace"))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.accessToken").doesNotExist())
                // Nem os ids do Notion saem daqui.
                .andExpect(content().string(not(containsString("user-id-123"))))
                .andExpect(content().string(not(containsString("workspace-id-456"))));
    }

    @Test
    void anUnknownEndpointAlsoDemandsLogin() throws Exception {
        mvc.perform(get("/api/qualquer-coisa"))
                .andExpect(status().isUnauthorized());
    }
}
