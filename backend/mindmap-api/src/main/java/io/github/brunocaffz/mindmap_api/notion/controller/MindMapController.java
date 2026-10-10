package io.github.brunocaffz.mindmap_api.notion.controller;

import io.github.brunocaffz.mindmap_api.notion.service.MindMapService;
import io.github.brunocaffz.mindmap_api.records.MindMapNode;
import io.github.brunocaffz.mindmap_api.shared.exception.InvalidPageIdException;
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

    public MindMapController(MindMapService service) { this.service = service; }

    @GetMapping("/notion/{pageId}")
    public MindMapNode fromNotion(@PathVariable String pageId) {
        String normalized = pageId.replace("-", "").toLowerCase(Locale.ROOT);
        if(!PAGE_ID.matcher(normalized).matches()){
            throw new InvalidPageIdException("O ID deve ter 32 caracteres hexadecimais, com ou sem hífens.");
        }
        return service.generateFromNotionPage(pageId);
    }
}
