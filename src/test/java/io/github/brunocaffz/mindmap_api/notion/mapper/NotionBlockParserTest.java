package io.github.brunocaffz.mindmap_api.notion.mapper;

import io.github.brunocaffz.mindmap_api.records.MindMapNode;
import tools.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;


public class NotionBlockParserTest {
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void convertsFlatBlocksIntoTree() throws Exception {
        JsonNode json = mapper.readTree(getClass().getResourceAsStream("/notion-page.json"));
        List<JsonNode> blocks = new ArrayList<>();
        json.get("results").forEach(blocks::add);

        MindMapNode root = new NotionBlockParser().parse("Hello from the API", blocks);

        assertEquals("Hello from the API", root.title());
        assertEquals(1, root.children().size());

        MindMapNode welcome = root.children().get(0);
        assertEquals("Welcome", welcome.title());
        assertEquals("This page was created with the Notion API. You just made your first request!",
                welcome.description());
        assertEquals(2, welcome.children().size());
        assertEquals("Read the API reference", welcome.children().get(0).title());
        assertEquals("Explore examples", welcome.children().get(1).title());
    }
}