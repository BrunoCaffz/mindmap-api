package io.github.brunocaffz.mindmap_api.notion.controller;

import io.github.brunocaffz.mindmap_api.auth.config.SecurityConfig;
import io.github.brunocaffz.mindmap_api.auth.service.NotionAccessResolver;
import io.github.brunocaffz.mindmap_api.enums.NodeType;
import io.github.brunocaffz.mindmap_api.notion.service.MindMapService;
import io.github.brunocaffz.mindmap_api.notion.service.NotionAccess;
import io.github.brunocaffz.mindmap_api.records.MindMapNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Com app.dev-token-fallback=true, quem não está logado chega ao serviço, que usa o token pessoal. */
@WebMvcTest(controllers = MindMapController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "app.dev-token-fallback=true")
class MindMapControllerDevFallbackTest {

    private static final String PAGE = "0123456789abcdef0123456789abcdef";

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private MindMapService service;

    @MockitoBean
    private NotionAccessResolver accessResolver;

    @Test
    void anonymousRequestReachesTheResolverWhichPicksThePersonalToken() throws Exception {
        NotionAccess personal = new NotionAccess("token-pessoal", false);
        when(accessResolver.resolve(isNull())).thenReturn(personal);
        when(service.generateFromNotionPage(personal, PAGE))
                .thenReturn(new MindMapNode(UUID.randomUUID(), "Página", "", NodeType.ROOT, List.of()));

        mvc.perform(get("/api/mindmaps/notion/" + PAGE)).andExpect(status().isOk());

        verify(service).generateFromNotionPage(personal, PAGE);
    }

    @Test
    void theFallbackDoesNotOpenAnythingElse() throws Exception {
        mvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
    }
}
