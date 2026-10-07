package io.github.brunocaffz.mindmap_api.notion.mapper;

import io.github.brunocaffz.mindmap_api.enums.NodeType;
import io.github.brunocaffz.mindmap_api.records.MindMapNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.util.*;

@Component
public class NotionBlockParser {

    private static final Logger log = LoggerFactory.getLogger(NotionBlockParser.class);

    private static final Set<String> LIST_TYPES =
            Set.of("bulleted_list_item", "numbered_list_item", "to_do", "toggle");

    private static final Set<String> CONTAINER_TYPES = Set.of("column_list", "column");

    private static final Set<String> SKIPPED_TYPES = Set.of("divider", "image");


    private static final Map<String, Integer> HEADING_LEVELS =
            Map.of("heading_1", 1, "heading_2", 2, "heading_3", 3);

    public MindMapNode parse(String pageTitle, List<JsonNode> blocks) {
        Builder root = new Builder(pageTitle, NodeType.ROOT);
        parseBlocks(blocks, root);
        return root.build();
    }

    private void parseBlocks(List<JsonNode> blocks, Builder container) {
        Deque<Entry> stack = new ArrayDeque<>();
        stack.push(new Entry(0, container));

        for (JsonNode block : blocks) {
            String type = block.path("type").asText();
            Integer level = HEADING_LEVELS.get(type);

            if (level != null) {
                while (stack.peek().level() >= level) {
                    stack.pop();
                }
                Builder node = new Builder(text(block, type), NodeType.HEADING);
                stack.peek().node().children.add(node);
                stack.push(new Entry(level, node));
                parseBlocks(childrenOf(block), node);   // headings toggle têm filhos
                continue;
            }

            Builder current = stack.peek().node();

            if (type.equals("paragraph")) {
                current.appendDescription(text(block, type));
            } else if (LIST_TYPES.contains(type)) {
                Builder item = new Builder(text(block, type), NodeType.LIST_ITEM);
                current.children.add(item);
                parseBlocks(childrenOf(block), item);
            } else if (type.equals("callout")) {
                String calloutText = text(block, type);
                if (calloutText.isBlank()) {
                    parseBlocks(childrenOf(block), current);   // callout só de agrupamento: achata
                } else {
                    Builder callout = new Builder(calloutText, NodeType.CALLOUT);
                    current.children.add(callout);
                    parseBlocks(childrenOf(block), callout);
                }
            } else if (type.equals("code")) {
                String lang = block.path("code").path("language").asText("");
                current.appendDescription("```" + lang + "\n" + text(block, type) + "\n```");
            } else if (type.equals("quote")) {
                current.appendDescription("> " + text(block, type));
            } else if (CONTAINER_TYPES.contains(type)) {
                parseBlocks(childrenOf(block), current);   // achata a coluna
            } else if (!SKIPPED_TYPES.contains(type)) {
                log.info("Ignored block type: {} (has_children={})", type, block.path("has_children").asBoolean());
            }
        }
    }

    private List<JsonNode> childrenOf(JsonNode block) {
        List<JsonNode> list = new ArrayList<>();
        block.path("children").forEach(list::add);
        return list;
    }

    // junta os pedaços de rich_text em uma string só
    private String text(JsonNode block, String type) {
        StringBuilder sb = new StringBuilder();
        for (JsonNode part : block.path(type).path("rich_text")) {
            sb.append(part.path("plain_text").asText());
        }
        return sb.toString();
    }

    private record Entry(int level, Builder node) {
    }

    private static class Builder {
        final String title;
        final NodeType type;
        final List<Builder> children = new ArrayList<>();
        private final StringBuilder description = new StringBuilder();

        Builder(String title, NodeType type) {
            this.title = title;
            this.type = type;
        }

        void appendDescription(String text) {
            if (text.isBlank()) return;
            if (!description.isEmpty()) description.append("\n");
            description.append(text);
        }

        MindMapNode build() {
            return new MindMapNode(UUID.randomUUID(), title, description.toString(), type,
                    children.stream().map(Builder::build).toList());
        }
    }
}