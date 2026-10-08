package io.github.brunocaffz.mindmap_api.notion.mapper;

import io.github.brunocaffz.mindmap_api.enums.NodeType;
import io.github.brunocaffz.mindmap_api.records.MindMapNode;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class NotionMarkdownParser {

    private static final Pattern HEADING = Pattern.compile("^(#{1,6})\\s+(.*)$");
    private static final Pattern LIST_ITEM = Pattern.compile("^(?:[-*]|\\d+\\.)\\s+(.*)$");
    private static final Pattern IMAGE = Pattern.compile("^!\\[.*]\\(.*\\)$");

    public MindMapNode parse(String pageTitle, String markdown) {
        return new Run(pageTitle).execute(markdown);
    }

    private static final class Run {
        private final Builder root;
        private Deque<Entry> headings = new ArrayDeque<>();
        private final Deque<Deque<Entry>> savedHeadings = new ArrayDeque<>();
        private final Deque<Builder> callouts = new ArrayDeque<>(); // contêineres de callout abertos
        private final Deque<Entry> lists = new ArrayDeque<>();      // caminho de itens de lista
        private int tagDepth = 0;                                   // profundidade de <columns>/<column>/<callout>
        private boolean calloutPending = false;

        Run(String title) {
            root = new Builder(title, NodeType.ROOT);
            headings.push(new Entry(0, root));
        }

        MindMapNode execute(String markdown) {
            boolean inFence = false;
            String lang = "";
            StringBuilder fence = new StringBuilder();

            for (String raw : markdown.split("\n", -1)) {
                String line = raw.strip();

                if (inFence) {
                    if (line.equals("```")) {
                        container().appendDescription("```" + lang + "\n" + fence.toString().stripTrailing() + "\n```");
                        inFence = false;
                    } else {
                        fence.append(raw).append("\n");
                    }
                    continue;
                }
                if (line.startsWith("```")) {
                    inFence = true;
                    lang = line.substring(3).strip();
                    fence.setLength(0);
                    continue;
                }

                if (line.isEmpty() || line.equals("---") || line.equals("<empty-block/>")
                        || IMAGE.matcher(line).matches()) continue;

                if (line.equals("<columns>")) { tagDepth++; lists.clear(); continue; }
                if (line.startsWith("<column ") || line.equals("<column>")) {
                    tagDepth++;
                    lists.clear();
                    savedHeadings.push(headings);
                    headings = new ArrayDeque<>();
                    headings.push(new Entry(0, savedHeadings.peek().peek().node()));   // começa no heading atual
                    continue;
                }
                if (line.equals("</columns>")) { tagDepth--; lists.clear(); continue; }
                if (line.equals("</column>")) {
                    tagDepth--;
                    lists.clear();
                    headings = savedHeadings.pop();
                    continue;
                }

                if (line.startsWith("<callout")) { tagDepth++; calloutPending = true; lists.clear(); continue; }
                if (line.equals("</callout>")) {
                    tagDepth--;
                    lists.clear();
                    if (calloutPending) calloutPending = false; else callouts.pop();
                    continue;
                }

                Matcher h = HEADING.matcher(line);
                if (h.matches()) {
                    int level = h.group(1).length();
                    while (headings.peek().level() >= level) headings.pop();
                    Builder node = new Builder(clean(h.group(2)), NodeType.HEADING);
                    headings.peek().node().children.add(node);
                    headings.push(new Entry(level, node));
                    lists.clear();
                    continue;
                }

                Matcher li = LIST_ITEM.matcher(line);
                if (li.matches()) {
                    if (calloutPending) {            // callout só de lista: não vira nó, achata
                        callouts.push(container());
                        calloutPending = false;
                    }
                    int depth = Math.max(leadingTabs(raw) - tagDepth, 0);
                    while (!lists.isEmpty() && lists.peek().level() >= depth) lists.pop();
                    Builder parent = lists.isEmpty() ? container() : lists.peek().node();
                    Builder item = new Builder(clean(li.group(1)), NodeType.LIST_ITEM);
                    parent.children.add(item);
                    lists.push(new Entry(depth, item));
                    continue;
                }

                // linha de texto
                lists.clear();
                if (calloutPending) {                // primeira linha do callout vira o título dele
                    calloutPending = false;
                    Builder callout = new Builder(clean(line), NodeType.CALLOUT);
                    container().children.add(callout);
                    callouts.push(callout);
                } else if (line.startsWith(">")) {
                    container().appendDescription("> " + clean(line.substring(1)));
                } else {
                    container().appendDescription(clean(line));
                }
            }
            return root.build("root");
        }

        private Builder container() {
            return callouts.isEmpty() ? headings.peek().node() : callouts.peek();
        }

        private static int leadingTabs(String s) {
            int n = 0;
            while (n < s.length() && s.charAt(n) == '\t') n++;
            return n;
        }

        private static String clean(String s) {
            return s.replaceAll("</?span[^>]*>", "")
                    .replaceAll("<br\\s*/?>", " ")
                    .replace("**", "")
                    .replace("`", "")
                    .replace("\\~", "~")
                    .strip();
        }
    }

    private record Entry(int level, Builder node) {}

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

        MindMapNode build(String key) {
            UUID id = UUID.nameUUIDFromBytes(key.getBytes(StandardCharsets.UTF_8));

            Map<String, Integer> seen = new HashMap<>();
            List<MindMapNode> built = new ArrayList<>();
            for (Builder child : children) {
                String base = key + "/" + child.type + ":" + child.title;
                int n = seen.merge(base, 1, Integer::sum);   // conta repetidos entre irmãos
                built.add(child.build(base + "#" + n));
            }
            return new MindMapNode(id, title, description.toString(), type, built);
        }
    }
}