package io.github.brunocaffz.mindmap_api.notion.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "notion")
public record NotionProperties(String token, String version) {}
