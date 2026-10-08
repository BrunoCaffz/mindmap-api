package io.github.brunocaffz.mindmap_api.notion.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

// Le do application.yml
@ConfigurationProperties(prefix = "notion")
public record NotionProperties(String token, String version) {}
