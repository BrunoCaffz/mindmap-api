# Deploy em VPS única

Front na Vercel, API + Postgres + Caddy na VPS via Docker Compose. Só o Caddy abre portas (80 e 443).

## Antes de subir

1. Aponte um host para a VPS e libere 80 e 443. Sem domínio, use `<ip-com-hifens>.sslip.io` (ex.: `203-0-113-10.sslip.io`).
2. `cp .env.prod.example .env.prod` e preencha tudo (senha do banco, chave de criptografia nova, credenciais do Notion).
3. Na integração do Notion, cadastre como Redirect URI o mesmo valor de `NOTION_REDIRECT_URI` (endereço da Vercel).
4. Na Vercel, defina `BACKEND_URL=https://<API_HOST>` e faça o deploy do front.

## Subir e atualizar

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.yml logs -f api
```

## Backup e restauração

```bash
docker compose -f docker-compose.prod.yml exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > backup-$(date +%F).sql.gz

# restaurar
gunzip -c backup-AAAA-MM-DD.sql.gz | docker compose -f docker-compose.prod.yml exec -T db sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'
```

Não perca o `TOKEN_ENCRYPTION_KEY`: sem ele os tokens do Notion guardados no banco ficam ilegíveis.
