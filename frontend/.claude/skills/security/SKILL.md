---
name: security
description: Use ao escrever ou revisar código do frontend que renderiza conteúdo vindo da API, faz requisições, lê variáveis de ambiente, recebe input do usuário, lida com login, permissões, upload ou dependências, e antes de commitar ou subir o projeto.
---

# Segurança

Este produto lê anotações privadas de usuários. Vazamento aqui é o pior erro possível.
Regra de ouro: **o navegador não é confiável**. Tudo que roda no frontend pode ser visto,
alterado ou burlado por quem usa. O frontend melhora a experiência; quem protege é o servidor.

## 1. Segredos e chaves

- Nenhum token, API key, senha, string de conexão de banco ou chave de admin no código do
  frontend, em localStorage, sessionStorage ou cookies acessíveis por JavaScript.
- Chaves de acesso total (admin, service role, token do Notion, credenciais do banco) vivem só no
  backend, em variável de ambiente. Nunca no frontend, nem "temporariamente".
- Variáveis com prefixo `NEXT_PUBLIC_` vão para o navegador: nada sensível nelas.
- `.env*` no `.gitignore` desde o início. Antes de todo commit, olhe a lista de arquivos
  (`git status`) e confirme que nenhum segredo entrou. Se um segredo vazou para o Git, avise o
  usuário para revogá-lo na hora; apagar num commit seguinte não basta.

## 2. Permissões decididas no servidor

- Toda decisão de permissão é conferida no servidor. Esconder um botão ou uma rota no frontend é
  só UX, nunca segurança.
- Todo endpoint que recebe um ID (de mapa, de página, de usuário) deve validar que o dono é quem
  está pedindo, antes de responder. O frontend nunca assume que "se o ID chegou, pode".
- O frontend nunca recebe nem guarda dados de outros usuários. Se uma resposta trouxer campos que
  a tela não usa, avise: o backend deve parar de enviá-los.
- Rotas e route handlers criados no Next.js não podem devolver dado sensível sem verificação. Se
  precisar de uma, pergunte antes de criar.

## 3. Banco de dados

- O frontend nunca fala direto com banco de dados. Só com o nosso backend, via `/api/...`.
- Se aparecer qualquer biblioteca de banco, ORM ou string de conexão no frontend, pare e avise.

## 4. Conteúdo vindo da API é não confiável

- `title` e `description` vêm de páginas do Notion e podem conter HTML ou scripts.
- NUNCA use `dangerouslySetInnerHTML`, `innerHTML` nem renderizador de markdown com HTML cru
  habilitado.
- Renderize como texto: cercas de código em `<pre><code>`, linhas `>` em `<blockquote>`, tudo como
  texto React (escapado por padrão).
- Links vindos da API: só `http:` e `https:`. Rejeite `javascript:` e `data:`.

## 5. Input validado e sanitizado

- Todo input do usuário é validado no frontend (para dar feedback) E de novo no backend (para
  proteger). A validação do frontend nunca é a única.
- `pageId`: 32 caracteres hexadecimais, com ou sem hífens. Rejeite qualquer outra coisa antes de
  enviar. Use `encodeURIComponent` ao montar URLs.
- Upload (se um dia existir): conferir tipo real do arquivo, tamanho máximo e extensão permitida no
  servidor; o `accept` do `<input>` é só conveniência. Nunca servir um arquivo enviado com o tipo
  que o usuário declarou.

## 6. Rate limit

- Rate limit é responsabilidade do servidor, em endpoints sensíveis (login, geração de mapa,
  verificação, resgate). O frontend não implementa "limite" como proteção.
- O frontend deve tratar resposta `429` com mensagem clara ("muitas tentativas, aguarde") e não
  repetir a requisição em loop.

## 7. Rede

- Só chame `/api/...` (nosso backend, via rewrite). Nunca `api.notion.com` nem outro domínio
  externo diretamente.

## 8. Dependências

- Não adicione pacote sem perguntar. Diga o que ele faz e por que não dá para evitar.
- Rode `npm audit` depois de instalar e informe o resultado.

## 9. Logs

- Não use `console.log` com conteúdo das páginas do usuário, tokens ou respostas completas da API.

## 10. Antes de subir (deploy ou push público)

Rode e informe o resultado de cada um:

- `gitleaks detect` (segredos no código e no histórico do Git)
- `npm audit` (dependências com vulnerabilidade conhecida)
- OWASP ZAP em modo baseline contra o app rodando (falhas comuns de web)
- Opengrep/Semgrep com regras de segurança, se disponível
  Se algum scanner não estiver instalado, diga isso em vez de pular o passo em silêncio.

## O que fica de fora do frontend

Itens de segurança que só o backend resolve (verificação de dono, rate limit, criptografia de
tokens, validação final de input) não devem ser "simulados" no frontend. Se a tarefa depender
deles, registre em `docs/SECURITY.md` o que o backend precisa garantir e avise o usuário.
