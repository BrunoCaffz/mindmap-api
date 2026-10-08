package io.github.brunocaffz.mindmap_api.notion.mapper;

import io.github.brunocaffz.mindmap_api.records.MindMapNode;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class NotionMarkdownParserTest {

    @Test
    void parsesHeadingsCodeCalloutsAndColumns() {
        String md = """
            ## Effect
            Define se a regra irá <span color="yellow">permitir</span> ou **negar**.
```json
            "Effect": "Allow"
```
            > Um **Deny explícito** tem prioridade.
            ## Principal
            <callout icon="💬">
            \t- Conta AWS;
            \t- Usuário;
            </callout>
            <columns>
            \t<column ratio="50">
            \t\t- Item na coluna
            \t</column>
            </columns>
            """;

        MindMapNode root = new NotionMarkdownParser().parse("Teste", md);

        assertEquals(2, root.children().size());

        MindMapNode effect = root.children().get(0);
        assertEquals("Effect", effect.title());
        assertTrue(effect.description().contains("permitir ou negar"));
        assertTrue(effect.description().contains("```json"));
        assertTrue(effect.description().contains("> Um Deny explícito"));

        MindMapNode principal = root.children().get(1);
        assertEquals(3, principal.children().size());   // 2 do callout (achatado) + 1 da coluna
        assertEquals("Conta AWS;", principal.children().get(0).title());
    }

    @Test
    void headingsInsideColumnStayScoped() {
        String md = """
        ## Permissões
        <columns>
        \t<column ratio="50">
        \t\t## Política
        \t\tTexto da política
        \t</column>
        </columns>
        ## Outra seção
        """;

        MindMapNode root = new NotionMarkdownParser().parse("Teste", md);

        assertEquals(2, root.children().size());
        MindMapNode permissoes = root.children().get(0);
        assertEquals("Política", permissoes.children().get(0).title());
        assertEquals("Outra seção", root.children().get(1).title());
    }
}