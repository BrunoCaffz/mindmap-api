# Notion Mindmap: Frontend

Tela única que mostra um mapa mental a partir de uma página do Notion.
O backend (Spring Boot, em `../backend`) já faz todo o trabalho de ler e estruturar o conteúdo.
O frontend só pede a árvore pronta e a desenha.

## Stack
Next.js (App Router), TypeScript, Tailwind CSS, React Flow (`@xyflow/react`),
layout em árvore com dagre (`@dagrejs/dagre`), layout de bolhas com `d3-force`,
animações com `framer-motion`. Sem biblioteca de estado global.

## Regras
- O frontend fala SOMENTE com o nosso backend, via `/api/...`. Nunca chame a API do Notion.
- Nunca guarde tokens, senhas ou segredos no frontend (nem em localStorage, nem em código).
  A única coisa salva no navegador é a escolha de tema (claro ou escuro).
- O backend roda em http://localhost:8080. Configure em `next.config` um rewrite de
  `/api/:path*` para `http://localhost:8080/api/:path*` (evita CORS). A URL do backend deve vir
  de uma variável de ambiente (`BACKEND_URL`), com esse valor como padrão.
- O formato do JSON é o contrato abaixo. Não invente campos. Se algo faltar, avise em vez de supor.
- Não modifique o conteúdo vindo da API. `title` e `description` são sempre texto, nunca HTML
  (ver a skill `security` em `.claude/skills/security`).
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
- `pageId`: 32 caracteres hexadecimais, com ou sem hífens. É validado antes de enviar.
- Erros chegam em `application/problem+json` com `title` e `detail` (português, prontos para exibir):
  400 (ID inválido), 404 (não encontrada ou sem acesso), 429 (limite do Notion, com `Retry-After`),
  502 e 504 (falha do Notion). A tela mostra o `detail` como texto. Se a resposta não for JSON, usa uma
  mensagem genérica pelo status. No 429 mostra o `Retry-After` e nunca repete a requisição sozinha.
  Sem resposta do backend (ou 500 em texto puro, que é o proxy do Next sem alcançar o backend), mostra
  "Não consegui falar com o servidor.".

## Layout e UX
- Topbar com o campo do Page ID e "Gerar mapa", sidebar com layout, espaçamento e tema, mapa ocupando
  o resto. Na tela vazia, "Ver exemplo" carrega `src/data/example.json` (mapa fictício, sem backend).
- Modo demonstração: com `NEXT_PUBLIC_DEMO_MODE=true` (definida no build, ex.: `NEXT_PUBLIC_DEMO_MODE=true npm run build`)
  o campo de ID e o botão somem, o exemplo carrega sozinho sem chamar o backend, uma faixa avisa que
  os dados são fictícios (com link para o repositório, em `src/lib/demo.ts`) e o `next.config` não
  configura o rewrite de `/api`. Sem a variável, tudo funciona normalmente. A variável é pública por
  natureza: nada sensível nela.
- Quatro layouts, escolhidos na sidebar. Todos testados com a página de exemplo:
  - **Mind Map:** esquerda para direita (dagre). O mais estável e o padrão.
  - **Tree:** de cima para baixo (dagre). Largo quando há muitos irmãos.
  - **Radial:** raiz no centro e um anel por nível. Funciona, mas é o mais simples visualmente:
    as linhas retas podem cruzar balões.
  - **Bolhas:** grafo de forças (`d3-force`), no estilo do Obsidian, com o título sob cada bolha.
  Radial e Bolhas são calculados uma vez com a árvore inteira e guardados, então recolher ou
  expandir um ramo não move os nós que já estavam na tela. Mind Map e Tree recalculam com os nós
  visíveis e deslizam até as novas posições.
- Espaçamento (compacto, normal, amplo) vale para os quatro layouts.
- Balão com tamanho por nível (raiz, nível 1, nível 2, nível 3 em diante) e altura que cresce com o
  título, até um limite de linhas. Depois do limite, o texto é cortado e o painel mostra o completo.
- Estado inicial: raiz e `INITIAL_DEPTH` níveis visíveis, o resto recolhido. Nó recolhido mostra um
  contador de descendentes (ex.: `+12`). Constantes de leitura ficam em `src/lib/view.ts`
  (`INITIAL_DEPTH`, `MIN_ZOOM`, `READING_ZOOM`, `CLICK_ZOOM`, `SEMANTIC_ZOOM`, `ANIMATION_MS`).
- Nunca mostrar tudo de uma vez e nunca deixar o zoom cair abaixo de `MIN_ZOOM`. Se o mapa não cabe,
  ele fica maior que a tela, ancorado na raiz, e a pessoa navega com pan.
- Recolher ou expandir um nó centraliza nele, sem mudar o zoom e sem enquadrar o mapa inteiro.
- Clicar num nó aproxima nele (zoom mínimo `CLICK_ZOOM`) e abre o painel lateral com o título completo
  e a `description`. Cercas de código viram bloco monoespaçado e linhas `>` viram citação.
- Barra sobre o mapa: busca por título, "Expandir tudo", "Recolher tudo" e seletor de níveis (1 a 4).
- Cor por ramo: cada filho direto da raiz recebe uma cor da paleta (`--branch-0` a `--branch-5` em
  `globals.css`, repetida a cada 6 ramos) e os descendentes herdam, inclusive nas linhas. A cor nunca é
  a única pista do tipo: HEADING tem fonte mais pesada e cantos mais redondos, LIST_ITEM tem fonte
  normal, cantos menores e bolinha, CALLOUT tem borda dupla, tom âmbar e ícone de lâmpada.
- Busca: ignora maiúsculas e acentos. Destaca os nós que combinam e esmaece os outros. Depois de
  `SEARCH_DEBOUNCE_MS` sem digitar (ou ao apertar Enter) expande os ancestrais dos resultados e foca no
  primeiro. Enter e seta para baixo vão ao próximo, Shift+Enter e seta para cima voltam, Esc limpa.
- Zoom semântico: abaixo de `SEMANTIC_ZOOM` o nó mostra só o título e o botão de recolher (sem bolinha,
  ícone nem número do contador).
- Zoom, pan e minimapa do React Flow habilitados.
- Loading com etapas visuais ("Lendo página do Notion...", "Analisando conteúdo...",
  "Organizando tópicos...", "Criando mapa...", "Finalizando..."). Trocam por tempo, pois é uma
  chamada só. Erro legível se a requisição falhar (ex.: página sem acesso).
- Tema claro e escuro: segue o sistema por padrão e pode ser trocado na sidebar.

## Estrutura
```
src/app/page.tsx               (estado da tela: Page ID, mapa, layout, tema)
src/components/AppHeader.tsx   (topbar com campo de Page ID)
src/components/MapSidebar.tsx  (layout, espaçamento, tema)
src/components/MindMap.tsx     (React Flow: visão inicial, foco, transições)
src/components/MapToolbar.tsx  (expandir tudo, recolher tudo, níveis)
src/components/MapNode.tsx     (balão)
src/components/BubbleNode.tsx  (bolha)
src/components/DetailPanel.tsx
src/components/EmptyMapState.tsx, LoadingMap.tsx, DemoBanner.tsx, icons.tsx
src/lib/api.ts                 (fetch tipado e validação do pageId)
src/lib/layout.ts              (árvore para nodes e edges: dagre, radial, bolhas)
src/lib/tree.ts, view.ts, theme.ts, demo.ts
src/data/example.json          (mapa fictício de exemplo)
src/types/mindmap.ts           (tipo MindMapNode)
```

## Comandos
`npm run dev` (porta 3000), `npm run lint`, `npm run build`.
Rode lint e build antes de dizer que terminou.
