# Environment Strategy

## Development

- API uses `apps/api/.env` for local variables.
- Mobile uses `apps/mobile/.env` for Expo public API URL variables.
- For local host development:
  - API: `DATABASE_URL=postgresql://user:password@localhost:5432/itdocs`
  - Mobile: `EXPO_PUBLIC_API_URL` for device/emulator, `EXPO_PUBLIC_API_URL_WEB` for web.
- Optional local auth fallback uses `DEV_MODE=true` in API env.

## Docker Compose

- Compose injects `DATABASE_URL=postgresql://user:password@db:5432/itdocs` into API container.
- API startup runs `prisma migrate deploy` before server start.
- Health checks gate service readiness for both `db` and `api`.

## Production

- Do not enable `DEV_MODE`.
- Provide real LDAP values for `AD_URL` and `AD_DOMAIN`.
- Set a strong `JWT_SECRET` via secure secret storage.
- Set `ADMIN_USERNAMES` explicitly for role assignment.
- Use production database host/credentials and TLS options in `DATABASE_URL`.

## Required API Variables

- `PORT`
- `JWT_SECRET`
- `AD_URL`
- `AD_DOMAIN`
- `ADMIN_USERNAMES`
- `DATABASE_URL`
