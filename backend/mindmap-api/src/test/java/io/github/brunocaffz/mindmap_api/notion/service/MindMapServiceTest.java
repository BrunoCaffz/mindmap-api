package io.github.brunocaffz.mindmap_api.notion.service;

import io.github.brunocaffz.mindmap_api.enums.NodeType;
import io.github.brunocaffz.mindmap_api.notion.client.NotionClient;
import io.github.brunocaffz.mindmap_api.notion.mapper.NotionMarkdownParser;
import io.github.brunocaffz.mindmap_api.records.MindMapNode;
import io.github.brunocaffz.mindmap_api.shared.exception.NotionConnectionExpiredException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MindMapServiceTest {

    private final NotionClient notion = mock(NotionClient.class);
    private final NotionMarkdownParser parser = mock(NotionMarkdownParser.class);
    private final MindMapService service = new MindMapService(notion, parser);

    private static HttpClientErrorException unauthorized() {
        return HttpClientErrorException.create(HttpStatus.UNAUTHORIZED, "Unauthorized", new HttpHeaders(), new byte[0], null);
    }

    @Test
    void readsNotionWithTheTokenOfTheAccessGiven() {
        MindMapNode tree = new MindMapNode(UUID.randomUUID(), "Título", "", NodeType.ROOT, List.of());
        when(notion.getPageTitle("token-da-ana", "pagina")).thenReturn("Título");
        when(notion.getPageMarkdown("token-da-ana", "pagina")).thenReturn("# md");
        when(parser.parse("Título", "# md")).thenReturn(tree);

        MindMapNode result = service.generateFromNotionPage(new NotionAccess("token-da-ana", true), "pagina");

        assertSame(tree, result);
        verify(notion).getPageMarkdown("token-da-ana", "pagina");
    }

    @Test
    void revokedUserTokenBecomesAnExpiredConnection() {
        when(notion.getPageTitle("token-da-ana", "pagina")).thenThrow(unauthorized());

        assertThrows(NotionConnectionExpiredException.class,
                () -> service.generateFromNotionPage(new NotionAccess("token-da-ana", true), "pagina"));
    }

    @Test
    void rejectedPersonalTokenKeepsTheServerSideFailure() {
        HttpClientErrorException error = unauthorized();
        when(notion.getPageTitle("token-pessoal", "pagina")).thenThrow(error);

        HttpClientErrorException thrown = assertThrows(HttpClientErrorException.class,
                () -> service.generateFromNotionPage(new NotionAccess("token-pessoal", false), "pagina"));

        assertEquals(401, thrown.getStatusCode().value());
    }
}
