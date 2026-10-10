# Decisões

Registro curto de por que o projeto é do jeito que é. Cada item tem o contexto, a escolha e o que ela custa.

## Monorepo com backend e frontend em pastas separadas
Um repositório só, com `backend/` e `frontend/`, cada um com a própria configuração (`pom.xml`, `package.json`). Um link, um README, um pipeline com jobs separados. Se um dia fizer sentido separar, as pastas já estão isoladas.

## Monólito, sem fila, cache ou microserviços
O MVP faz uma chamada ao Notion e devolve uma árvore. Redis, filas e WebSocket entram quando houver um problema real que eles resolvam (por exemplo, geração com IA demorando vários segundos).

## Modelo interno próprio (`MindMapNode`)
O resto do sistema nunca vê o formato do Notion. Só o `NotionClient` e os parsers conhecem a API deles. Trocar a fonte (outro formato do Notion, PDF, markdown local) significa escrever um parser novo, sem mexer no front.

## Markdown em vez de blocos para ler a página
Blocos: uma chamada por bloco com filhos, 11,2 s numa página real, perto do limite de cerca de 3 requisições por segundo do Notion. Markdown: uma chamada, 1,8 s no total. Custo: parser de texto com tags de coluna e callout, e nenhum id de bloco. O `NotionBlockParser` e o `getBlockTree` ficam como plano B. O endpoint de markdown exige uma versão de API mais nova, então o header `Notion-Version` é sobrescrito só nessa chamada.

## Ids dos nós derivados do caminho
O endpoint de markdown não traz ids de bloco. O id de cada nó é um UUID gerado a partir do caminho (pai, tipo, título e ocorrência entre irmãos), então o mesmo conteúdo gera os mesmos ids. Renomear um título muda o id dele e o dos filhos. Aceitável para o MVP.

## Parser sem estado compartilhado
O parser é um singleton do Spring. Todo o estado da leitura (pilhas, flags) vive num objeto criado a cada chamada, para duas requisições simultâneas não se misturarem.

## Frontend só fala com o backend, via rewrite
O Next.js repassa `/api/*` para o backend. O navegador só enxerga a própria origem, então não existe CORS para configurar, e o front nunca chama a API do Notion nem guarda token.

## Token pessoal agora, OAuth depois
Hoje o backend usa um token meu, que enxerga tudo da minha conta. Por isso ele não vai a lugar nenhum fora da minha máquina. A versão pública mostra só um mapa de exemplo, sem backend. Para outras pessoas, o caminho é OAuth2 com o Notion: cada usuário autoriza o próprio workspace e escolhe as páginas.

## Erros do Notion viram respostas claras
Um `@RestControllerAdvice` traduz as falhas do Notion em respostas no formato Problem Details: 404 para página inexistente ou sem acesso, 400 para ID inválido, 429 (com `Retry-After`) quando o Notion limita, 502 e 504 para falhas do lado deles. Falhas de autenticação do token do servidor viram 502 genérico: o usuário não precisa saber, e o detalhe vai pro log.

## Postgres local na porta 5433
A 5432 já era usada por um Postgres instalado na máquina, e a aplicação acabava conectando no banco errado. O compose publica `5433:5432` e a URL do `application.yml` aponta para `localhost:5433`.

## Teste de contexto desativado por enquanto
O `contextLoads` gerado pelo Spring Initializr precisa de banco e token reais, então quebrava em qualquer máquina sem o Docker ligado. Está com `@Disabled`. Quando entrar persistência, ele volta com Testcontainers.

## Demo pública sem backend
O deploy público mostra um mapa de exemplo fictício, carregado de um JSON dentro do frontend. Assim qualquer pessoa vê o produto funcionando sem que o meu Notion fique exposto.
