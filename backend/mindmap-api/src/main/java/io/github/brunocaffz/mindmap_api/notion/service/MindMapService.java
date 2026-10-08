package io.github.brunocaffz.mindmap_api.notion.service;

import io.github.brunocaffz.mindmap_api.notion.client.NotionClient;
import io.github.brunocaffz.mindmap_api.notion.mapper.NotionMarkdownParser;
import io.github.brunocaffz.mindmap_api.records.MindMapNode;
import org.springframework.stereotype.Service;

@Service
public class MindMapService {

    private final NotionClient notion;
    private final NotionMarkdownParser markdownParser;

    public MindMapService(NotionClient notion, NotionMarkdownParser markdownParser) {
        this.notion = notion;
        this.markdownParser = markdownParser;
    }

    public MindMapNode generateFromNotionPage(String pageId) {
        String title = notion.getPageTitle(pageId);
        String markdown = notion.getPageMarkdown(pageId);
        return markdownParser.parse(title, markdown);
    }


}
