package io.github.brunocaffz.mindmap_api.notion.service;

import io.github.brunocaffz.mindmap_api.notion.client.NotionClient;
import io.github.brunocaffz.mindmap_api.notion.mapper.NotionMarkdownParser;
import io.github.brunocaffz.mindmap_api.records.MindMapNode;
import io.github.brunocaffz.mindmap_api.shared.exception.NotionConnectionExpiredException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;

@Service
public class MindMapService {

    private final NotionClient notion;
    private final NotionMarkdownParser markdownParser;

    public MindMapService(NotionClient notion, NotionMarkdownParser markdownParser) {
        this.notion = notion;
        this.markdownParser = markdownParser;
    }

    public MindMapNode generateFromNotionPage(NotionAccess access, String pageId) {
        try {
            String title = notion.getPageTitle(access.token(), pageId);
            String markdown = notion.getPageMarkdown(access.token(), pageId);
            return markdownParser.parse(title, markdown);
        } catch (HttpClientErrorException.Unauthorized ex) {
            // O token do usuário foi revogado ou expirou: ele precisa entrar de novo. Com o token pessoal de
            // desenvolvimento, um 401 é problema de configuração do servidor e segue o caminho de sempre.
            if (access.userOwned()) {
                throw new NotionConnectionExpiredException();
            }
            throw ex;
        }
    }


}
