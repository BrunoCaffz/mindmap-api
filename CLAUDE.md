# Notion Mindmap
Webapp que transforma páginas do Notion em mapas mentais.
## Stack
Backend: Java 21, Spring Boot 3, Postgres. Front: Next, React Flow, Tailwind.
## Regras
- Monólito modular: pacotes notion, mindmap, auth, shared.
- Chamadas HTTP ao Notion só dentro de notion.client.
- O resto do sistema só enxerga o modelo interno, nunca os DTOs do Notion.
- Token do Notion nunca vai pro front nem pra log.
- Sem Redis, filas ou microserviços no MVP.