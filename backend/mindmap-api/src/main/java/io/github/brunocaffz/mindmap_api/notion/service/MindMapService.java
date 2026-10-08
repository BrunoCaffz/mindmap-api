package io.github.brunocaffz.mindmap_api.notion.service;

import io.github.brunocaffz.mindmap_api.notion.client.NotionClient;
import io.github.brunocaffz.mindmap_api.notion.mapper.NotionBlockParser;
import io.github.brunocaffz.mindmap_api.notion.mapper.NotionMarkdownParser;
import io.github.brunocaffz.mindmap_api.records.MindMapNode;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

import java.util.List;

@Service
public class MindMapService {

    private final NotionClient notion;
    private final NotionBlockParser parser;
    private final NotionMarkdownParser markdownParser;

    public MindMapService(NotionClient notion, NotionBlockParser parser, NotionMarkdownParser markdownParser) {
        this.notion = notion;
        this.parser = parser;
        this.markdownParser = markdownParser;
    }

    public MindMapNode generateFromNotionPage(String pageId) {
        String title = notion.getPageTitle(pageId);
        String markdown = notion.getPageMarkdown(pageId);
        return markdownParser.parse(title, markdown);
    }


}
