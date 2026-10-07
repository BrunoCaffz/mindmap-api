package io.github.brunocaffz.mindmap_api.notion.mapper;

import io.github.brunocaffz.mindmap_api.enums.NodeType;
import io.github.brunocaffz.mindmap_api.records.MindMapNode;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.util.*;

@Component
public class NotionBlockParser {
    private static final Map<String, Integer> HEADING_LEVELS =
            Map.of("heading_1", 1, "heading_2", 2, "heading_3", 3);

    public MindMapNode parse(String pageTitle, List<JsonNode> blocks) {
        Builder root = new Builder(pageTitle, NodeType.ROOT);
        Deque<Entry> stack = new ArrayDeque<>();
        stack.push(new Entry(0, root));   // a raiz tem nível 0

        for (JsonNode block : blocks) {
            String type = block.path("type").asText();
            Integer level = HEADING_LEVELS.get(type);

            if (level != null) {
                // sobe na pilha até achar um heading de nível menor (o "pai")
                while (stack.peek().level() >= level) {
                    stack.pop();
                }
                Builder node = new Builder(text(block, type), NodeType.HEADING);
                stack.peek().node().children.add(node);
                stack.push(new Entry(level, node));

            } else if (type.equals("paragraph")) {
                stack.peek().node().appendDescription(text(block, type));

            } else if (type.equals("bulleted_list_item") || type.equals("numbered_list_item")) {
                stack.peek().node().children.add(new Builder(text(block, type), NodeType.LIST_ITEM));
            }
            // qualquer outro tipo de bloco é ignorado por enquanto
        }
        return root.build();
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