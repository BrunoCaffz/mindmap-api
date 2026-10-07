package io.github.brunocaffz.mindmap_api.notion.client;

import io.github.brunocaffz.mindmap_api.notion.config.NotionProperties;
import io.github.brunocaffz.mindmap_api.notion.mapper.NotionBlockParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class NotionClient {
    private static final Logger log = LoggerFactory.getLogger(NotionClient.class);

    private static final Set<String> NO_RECURSE = Set.of("child_page", "child_database");
    private final AtomicInteger calls = new AtomicInteger();
    private final RestClient http;

    public NotionClient(NotionProperties props){
        this.http = RestClient.builder()
                .baseUrl("https://api.notion.com/v1")
                .defaultHeader("Authorization", "Bearer " + props.token())
                .defaultHeader("Notion-Version", props.version())
                .build();
    }

    public String getPageTitle(String pageId) {
        JsonNode page = http.get().uri("/pages/{id}", pageId)
                .retrieve().body(JsonNode.class);

        for (JsonNode prop : page.path("properties")) {
            if ("title".equals(prop.path("type").asText())) {
                StringBuilder sb = new StringBuilder();
                prop.path("title").forEach(part -> sb.append(part.path("plain_text").asText()));
                return sb.toString().trim();
            }
        }
        return "Untitled";
    }

    public List<JsonNode> getBlockChildren(String blockId){
        List<JsonNode> all = new ArrayList<>();
        String cursor = null;

        do{
            final String current = cursor;
            log.info("Notion call #{}", calls.incrementAndGet());
            JsonNode res = http.get()
                    .uri(b -> b.path("/blocks/{id}/children")
                    .queryParam("page_size", 100)
                    .queryParamIfPresent("start_cursor", Optional.ofNullable(current))
                    .build(blockId))
                    .retrieve().body(JsonNode.class);

            assert res != null;
            res.path("results").forEach(all::add);
            cursor = res.path("has_more").asBoolean() ? res.path("next_cursor").asText() : null;
        } while(cursor != null);

        return all;
    }

    public List<JsonNode> getBlockTree(String blockId) {
        List<JsonNode> blocks = getBlockChildren(blockId);
        for (JsonNode block : blocks) {
            String type = block.path("type").asText();
            if (block.path("has_children").asBoolean() && !NO_RECURSE.contains(type)) {
                List<JsonNode> children = getBlockTree(block.path("id").asText());
                ArrayNode array = ((ObjectNode) block).putArray("children");
                children.forEach(array::add);
            }
        }
        return blocks;
    }
}
