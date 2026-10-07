package io.github.brunocaffz.mindmap_api.notion.controller;

import io.github.brunocaffz.mindmap_api.notion.service.MindMapService;
import io.github.brunocaffz.mindmap_api.records.MindMapNode;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mindmaps")
public class MindMapController {

    private final MindMapService service;

    public MindMapController(MindMapService service) { this.service = service; }

    @GetMapping("/notion/{pageId}")
    public MindMapNode fromNotion(@PathVariable String pageId) {
        return service.generateFromNotionPage(pageId);
    }
}
