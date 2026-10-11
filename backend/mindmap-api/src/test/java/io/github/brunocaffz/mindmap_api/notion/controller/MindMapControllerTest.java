package io.github.brunocaffz.mindmap_api.notion.controller;

import io.github.brunocaffz.mindmap_api.auth.NotionPrincipal;
import io.github.brunocaffz.mindmap_api.auth.config.SecurityConfig;
import io.github.brunocaffz.mindmap_api.auth.service.NotionAccessResolver;
import io.github.brunocaffz.mindmap_api.enums.NodeType;
import io.github.brunocaffz.mindmap_api.notion.service.MindMapService;
import io.github.brunocaffz.mindmap_api.notion.service.NotionAccess;
import io.github.brunocaffz.mindmap_api.records.MindMapNode;
import io.github.brunocaffz.mindmap_api.shared.exception.UnauthenticatedException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = MindMapController.class)
@Import(SecurityConfig.class)
class MindMapControllerTest {

    private static final String PAGE = "0123456789abcdef0123456789abcdef";
    private static final NotionPrincipal ANA = new NotionPrincipal("user-1", "Ana", "ws-1", "Meu Workspace");

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private MindMapService service;

    @MockitoBean
    private NotionAccessResolver accessResolver;

    private static UsernamePasswordAuthenticationToken loggedIn() {
        return UsernamePasswordAuthenticationToken.authenticated(ANA, null, AuthorityUtils.createAuthorityList("ROLE_USER"));
    }

    @Test
    void withoutSessionReturns401ProblemDetailsAndNeverReadsNotion() throws Exception {
        mvc.perform(get("/api/mindmaps/notion/" + PAGE))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(401));

        verifyNoInteractions(service, accessResolver);
    }

    @Test
    void loggedInUserReadsNotionWithTheirOwnToken() throws Exception {
        NotionAccess access = new NotionAccess("token-da-ana", true);
        when(accessResolver.resolve(ANA)).thenReturn(access);
        when(service.generateFromNotionPage(eq(access), eq(PAGE)))
                .thenReturn(new MindMapNode(UUID.randomUUID(), "Minha página", "", NodeType.ROOT, List.of()));

        mvc.perform(get("/api/mindmaps/notion/" + PAGE).with(authentication(loggedIn())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Minha página"));

        verify(accessResolver).resolve(ANA);
        verify(service).generateFromNotionPage(access, PAGE);
    }

    @Test
    void invalidPageIdIsRejectedBeforeLookingForAToken() throws Exception {
        mvc.perform(get("/api/mindmaps/notion/nao-e-um-id").with(authentication(loggedIn())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        verifyNoInteractions(accessResolver, service);
    }

    @Test
    void sessionWhoseTokenDisappearedIsTreatedAsLoggedOut() throws Exception {
        when(accessResolver.resolve(any())).thenThrow(new UnauthenticatedException());

        mvc.perform(get("/api/mindmaps/notion/" + PAGE).with(authentication(loggedIn())))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));

        verifyNoInteractions(service);
    }
}
