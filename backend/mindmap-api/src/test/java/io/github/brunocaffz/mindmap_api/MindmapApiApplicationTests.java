package io.github.brunocaffz.mindmap_api;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@Disabled("Precisa de Postgres e NOTION_TOKEN reais. Volta com Testcontainers quando houver persistência.")
@SpringBootTest
class MindmapApiApplicationTests {

	@Test
	void contextLoads() {
	}

}
