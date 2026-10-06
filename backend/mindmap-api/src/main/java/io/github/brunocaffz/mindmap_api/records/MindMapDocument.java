package io.github.brunocaffz.mindmap_api.records;

import java.time.Instant;
import java.util.UUID;

public record MindMapDocument(
        UUID id,
        String title,
        MindMapNode root,
        String sourceType,   // "NOTION"
        String sourceId,     // id da página
        Instant createdAt
) {}
