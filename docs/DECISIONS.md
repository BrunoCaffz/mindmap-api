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

## Login com o Notion (OAuth2) e token pessoal só como fallback
Cada pessoa autoriza o próprio workspace e escolhe as páginas que o app pode ler. O fluxo é o Authorization Code: `GET /api/auth/notion/login` manda para a tela do Notion com um `state` aleatório, e `GET /api/auth/notion/callback` confere o `state`, troca o `code` pelo token e abre a sessão. O token pessoal (`NOTION_TOKEN`) continua existindo só para desenvolvimento: com `app.dev-token-fallback=true`, quem não está logado lê o Notion com ele. O padrão é `false`, e em produção ele fica desligado. Custo: a integração precisa ser pública no Notion, com um Redirect URI cadastrado que seja idêntico ao `NOTION_REDIRECT_URI`.

## Erros do Notion viram respostas claras
Um `@RestControllerAdvice` traduz as falhas do Notion em respostas no formato Problem Details: 404 para página inexistente ou sem acesso, 400 para ID inválido, 429 (com `Retry-After`) quando o Notion limita, 502 e 504 para falhas do lado deles. Falhas de autenticação do token do servidor viram 502 genérico: o usuário não precisa saber, e o detalhe vai pro log.

## Postgres local na porta 5433
A 5432 já era usada por um Postgres instalado na máquina, e a aplicação acabava conectando no banco errado. O compose publica `5433:5432` e a URL do `application.yml` aponta para `localhost:5433`.

## Teste de contexto desativado, testes de fatia no lugar
O `contextLoads` precisa de Postgres e das variáveis de ambiente, então quebraria em qualquer máquina e no CI sem Docker. Continua com `@Disabled`. No lugar dele, os testes de login e de segurança usam `@WebMvcTest` com a cadeia de segurança real e o cliente do Notion simulado, e o `mvn verify` passa sem banco. A parte que só um Postgres de verdade prova (Flyway, tabelas de sessão, criptografia gravada) foi conferida à mão com um banco descartável. Testcontainers, com `disabledWithoutDocker`, é o próximo passo para trazer isso para o CI.

## Demo pública sem backend
O deploy público mostra um mapa de exemplo fictício, carregado de um JSON dentro do frontend. Assim qualquer pessoa vê o produto funcionando sem que o meu Notion fique exposto.

## Sessão no servidor em vez de JWT
Depois do login a pessoa recebe só um cookie com o id da sessão (`MINDMAP_SESSION`, `HttpOnly`, `SameSite=Lax`, `Secure` em produção). A sessão fica no Postgres (Spring Session JDBC) e expira depois de 8 horas sem uso. Um JWT só faria sentido se o servidor não precisasse guardar nada, mas aqui ele precisa guardar o token do Notion de qualquer jeito, e queremos poder encerrar uma sessão de verdade (logout, token revogado, conta comprometida), o que um JWT já emitido não permite sem uma lista de bloqueio, que é estado de novo. Custo: uma leitura no banco por requisição autenticada e um banco no caminho do login. Para um MVP com poucas pessoas isso é irrelevante, e trocar o armazenamento da sessão (Redis, por exemplo) é configuração, não reescrita.

A sessão guarda só a identidade (id e nome do usuário e do workspace). O token do Notion não entra nela: fica criptografado numa tabela à parte e é buscado quando preciso.

## O token do Notion nunca vai ao front
O token abre tudo o que a pessoa compartilhou com a integração. Se ele fosse para o navegador, qualquer script na página (uma dependência comprometida, uma extensão, um XSS) o levaria embora, e ele ficaria em localStorage ou na memória, fora do nosso controle. Então o navegador só tem o cookie de sessão, que é `HttpOnly` e não é legível por JavaScript. Para cada leitura, o backend usa o id da sessão para achar o token do usuário e chama o Notion sozinho. `GET /api/me` devolve só o nome do usuário e do workspace: sem token e sem ids. O token também não aparece em log, em mensagem de erro nem no `toString` dos objetos que o carregam.

## Tokens criptografados em repouso (AES-GCM)
Os tokens ficam na tabela `notion_tokens`, criptografados com AES-256-GCM. Cada registro usa um nonce aleatório de 96 bits, guardado junto do texto cifrado, e o GCM autentica o conteúdo: se alguém mexer no dado no banco, a leitura falha em vez de devolver lixo. O usuário e o workspace entram como dado associado autenticado, então um valor copiado para a linha de outra pessoa não descriptografa. A chave vem de `TOKEN_ENCRYPTION_KEY` (base64, 32 bytes) e o app não sobe se ela faltar ou for inválida.

Isso protege contra vazamento do banco ou de um backup: sem a chave, a tabela é inútil. Não protege contra alguém que controle o servidor em execução, porque aí a chave e a memória estão ao alcance. Limites que ficam como estão por enquanto: não há rotação de chave (trocá-la obriga todo mundo a entrar de novo) e o token não é apagado ao sair, nem revogado no Notion.

## CSRF com cookie legível pelo front
Só o logout é um POST, mas o CSRF fica ligado para todo método que altera estado. O token vai num cookie `XSRF-TOKEN` que o JavaScript do front consegue ler, e o front o devolve no cabeçalho `X-XSRF-TOKEN`. Sem o cabeçalho, o POST recebe 403. Como a API só devolve JSON, usamos o token em texto simples (sem o modo XOR, que serve para proteger formulários HTML). O `GET` do callback do OAuth não precisa de CSRF: quem o protege é o `state`.

## Defesas do callback do OAuth
O `state` é um valor aleatório de 32 bytes, guardado na sessão e válido uma vez só: é apagado ao ser conferido, mesmo quando a conferência falha, e é comparado em tempo constante. Sem sessão, sem `state` ou com `state` diferente, a resposta é 400 em Problem Details, sem repetir o que veio na URL, e o Notion nem é chamado. Antes de autenticar, o id da sessão é trocado (`changeSessionId`), para um id plantado antes do login (session fixation) não valer depois. O cookie de sessão antigo deixa de autenticar.

## Tabelas da sessão versionadas pelo Flyway
As tabelas do Spring Session ficam numa migração (`V2`), copiadas do esquema oficial, e `spring.session.jdbc.initialize-schema` fica em `never`. Assim todo o esquema do banco tem um só dono e um histórico, em vez de parte criada pelo Flyway e parte pelo Spring Session.
