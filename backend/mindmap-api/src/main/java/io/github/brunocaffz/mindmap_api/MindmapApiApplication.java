package io.github.brunocaffz.mindmap_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@ConfigurationPropertiesScan
@SpringBootApplication
public class MindmapApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(MindmapApiApplication.class, args);
	}

}
