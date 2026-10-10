package io.github.brunocaffz.mindmap_api.notion.mapper;

import io.github.brunocaffz.mindmap_api.enums.NodeType;
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

    @Test
    void parsesCodeAndCalloutChildren() throws Exception {
        String json = """
        [
          {"type":"heading_2","heading_2":{"rich_text":[{"plain_text":"Effect"}]}},
          {"type":"code","code":{"language":"shell","rich_text":[{"plain_text":"aws s3 ls"}]}},
          {"type":"callout","callout":{"rich_text":[{"plain_text":"Dica"}]},
           "children":[
             {"type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{"plain_text":"Deny vence Allow"}]}}
           ]}
        ]
        """;
        List<JsonNode> blocks = new ArrayList<>();
        new ObjectMapper().readTree(json).forEach(blocks::add);

        MindMapNode root = new NotionBlockParser().parse("Teste", blocks);

        MindMapNode effect = root.children().get(0);
        assertTrue(effect.description().contains("aws s3 ls"));

        MindMapNode callout = effect.children().get(0);
        assertEquals(NodeType.CALLOUT, callout.type());
        assertEquals("Deny vence Allow", callout.children().get(0).title());
    }
}