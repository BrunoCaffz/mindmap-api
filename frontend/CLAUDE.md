# Notion Mindmap — Frontend

Tela única que mostra um mapa mental a partir de uma página do Notion.
O backend (Spring Boot, em `../backend`) já faz todo o trabalho de ler e estruturar o conteúdo.
O frontend só pede a árvore pronta e a desenha.

## Stack
Next.js (App Router), TypeScript, Tailwind CSS, React Flow (`@xyflow/react`),
layout automático com dagre (`@dagrejs/dagre`). Sem biblioteca de estado global.

## Regras
- O frontend fala SOMENTE com o nosso backend, via `/api/...`. Nunca chame a API do Notion.
- Nunca guarde tokens, senhas ou segredos no frontend (nem em localStorage, nem em código).
- O backend roda em http://localhost:8080. Configure em `next.config` um rewrite de
  `/api/:path*` para `http://localhost:8080/api/:path*` (evita CORS). A URL do backend deve vir
  de uma variável de ambiente (`BACKEND_URL`), com esse valor como padrão.
- O formato do JSON é o contrato abaixo. Não invente campos. Se algo faltar, avise em vez de supor.
- Escopo do MVP: UMA tela. Sem login, sem edição, sem salvar, sem exportar. Não adicione bibliotecas
  além das listadas sem perguntar.
- Código simples e legível. Componentes pequenos. Tipos TypeScript explícitos.

## API
`GET /api/mindmaps/notion/{pageId}` devolve a árvore (tempo típico ~2 s):

```json
{
  "id": "uuid",
  "title": "IAM - Identity and Access Managment",
  "description": "",
  "type": "ROOT",
  "children": [
    {
      "id": "uuid",
      "title": "Effect",
      "description": "Define se a regra irá permitir ou negar.\n```json\n\"Effect\": \"Allow\"\n```\n> Um Deny explícito tem prioridade.",
      "type": "HEADING",
      "children": [
        { "id": "uuid", "title": "Item", "description": "", "type": "LIST_ITEM", "children": [] }
      ]
    }
  ]
}
```

- `type`: `ROOT` | `HEADING` | `LIST_ITEM` | `CALLOUT`.
- `description` é texto com markdown simples: cercas de código (```) e linhas com `>` (citação).
  Pode ter `\n`. Pode ser vazia.
- `title` pode ser longo (às vezes uma frase inteira). Pode estar vazio em casos raros.
- Os ids são estáveis entre chamadas para o mesmo conteúdo.

## Layout e UX
- Converter a árvore em nodes e edges e posicionar com dagre (direção esquerda → direita).
- Custom node, visual limpo e minimalista, com estilo diferente por `type`.
- Título do node truncado em 2–3 linhas (line-clamp). Largura máxima fixa para o dagre calcular.
- Clicar num node abre um painel lateral com o título completo e a `description`.
  Renderize cercas de código como bloco monoespaçado e linhas `>` como citação.
- Cada node com filhos tem botão de recolher/expandir o ramo (começa tudo expandido).
- Zoom, pan e minimapa do React Flow habilitados; `fitView` ao carregar.
- Loading com etapas visuais, não só um spinner: "Lendo página do Notion...",
  "Organizando tópicos...", "Criando mapa...". São mensagens que trocam por tempo, pois é uma
  chamada só. Mostre erro legível se a requisição falhar (ex.: página sem acesso).
- Tema claro e escuro seguindo o sistema.

## Estrutura sugerida
```
src/app/page.tsx              (campo de pageId + botão "Gerar mapa" + área do mapa)
src/components/MindMap.tsx    (React Flow)
src/components/MapNode.tsx    (custom node)
src/components/DetailPanel.tsx
src/lib/api.ts                (fetch tipado)
src/lib/layout.ts             (árvore → nodes/edges + dagre)
src/types/mindmap.ts          (tipo MindMapNode)
```

## Comandos
`npm run dev` (porta 3000), `npm run lint`, `npm run build`.
Rode lint e build antes de dizer que terminou.