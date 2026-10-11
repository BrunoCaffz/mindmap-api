package io.github.brunocaffz.mindmap_api.notion.controller;

import io.github.brunocaffz.mindmap_api.auth.NotionPrincipal;
import io.github.brunocaffz.mindmap_api.auth.service.NotionAccessResolver;
import io.github.brunocaffz.mindmap_api.notion.service.MindMapService;
import io.github.brunocaffz.mindmap_api.notion.service.NotionAccess;
import io.github.brunocaffz.mindmap_api.records.MindMapNode;
import io.github.brunocaffz.mindmap_api.shared.exception.InvalidPageIdException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/mindmaps")
public class MindMapController {

    private static final Pattern PAGE_ID = Pattern.compile("^[0-9a-f]{32}$");

    private final MindMapService service;
    private final NotionAccessResolver accessResolver;

    public MindMapController(MindMapService service, NotionAccessResolver accessResolver) {
        this.service = service;
        this.accessResolver = accessResolver;
    }

    @GetMapping("/notion/{pageId}")
    public MindMapNode fromNotion(@PathVariable String pageId,
                                  @AuthenticationPrincipal NotionPrincipal principal) {
        String normalized = pageId.replace("-", "").toLowerCase(Locale.ROOT);
        if(!PAGE_ID.matcher(normalized).matches()){
            throw new InvalidPageIdException("O ID deve ter 32 caracteres hexadecimais, com ou sem hífens.");
        }
        // Lê o Notion com o token de quem está logado. Sem sessão (e sem o fallback de desenvolvimento): 401.
        NotionAccess access = accessResolver.resolve(principal);
        return service.generateFromNotionPage(access, pageId);
    }
}
