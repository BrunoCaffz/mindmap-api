package io.github.brunocaffz.mindmap_api.records;

import io.github.brunocaffz.mindmap_api.enums.NodeType;

import java.util.List;
import java.util.UUID;

public record MindMapNode(
        UUID id,
        String title,
        String description,
        NodeType type,
        List<MindMapNode> children)
{}