# VM Deployment Blueprint (Primary/Replica DB + Separate WEB/API)

This blueprint prepares MapIT for a 4-VM production topology without requiring immediate migration.

## Target Topology

- DB Primary VM: PostgreSQL primary (read/write)
- DB Replica VM: PostgreSQL standby (streaming replication)
- API VM: Express API + Prisma
- WEB VM: Next.js app

## Private Network Example

- DB Primary: 10.10.10.10
- DB Replica: 10.10.10.11
- API: 10.10.10.20
- WEB: 10.10.10.30

Use static private IPs or internal DNS.

## What Was Implemented

- Web server routes now resolve API endpoint from environment and fail fast in production if missing.
- API CORS now supports explicit allowed-origin configuration via `CORS_ORIGIN`.
- Production-ready `.env.example` templates are available:
  - `apps/api/.env.example`
  - `apps/web/.env.example`
  - root `.env.example`
- Deployment assets are available:
  - systemd services: `deploy/systemd/mapit-api.service`, `deploy/systemd/mapit-web.service`
  - Nginx site config: `deploy/nginx/mapit-web.conf`
  - one-command installer: `deploy/scripts/install-vm-services.sh`
  - DB replication runbook: `docs/postgres-primary-replica-runbook.md`
  - failover checklist: `docs/db-failover-checklist.md`

## Install Order on VMs

1. Configure DB primary and verify connectivity.
2. Configure DB replica from primary base backup and confirm recovery mode.
3. Deploy API VM and point `DATABASE_URL` to DB primary.
4. Deploy WEB VM and point `API_URL` to API VM private endpoint.

## API VM Setup

1. Clone repo and install dependencies.
2. Copy `apps/api/.env.example` to `.env` and fill real values.
3. Run:

```bash
npm --workspace=apps/api install
npm --workspace=apps/api run prisma:generate
npm --workspace=apps/api run prisma:migrate:deploy
npm --workspace=apps/api run start
```

## WEB VM Setup

1. Clone repo and install dependencies.
2. Copy `apps/web/.env.example` to `.env.local` and fill real values.
3. Run:

```bash
npm --workspace=apps/web install
npm --workspace=apps/web run build
npm --workspace=apps/web run start
```

## Systemd Installation (API VM + WEB VM)

### Prerequisites

- Repo path: `/opt/mapit`
- Linux user/group: `mapit`

Create user if needed:

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin mapit
sudo chown -R mapit:mapit /opt/mapit
```

### API VM service

```bash
sudo cp /opt/mapit/deploy/systemd/mapit-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mapit-api
sudo systemctl start mapit-api
sudo systemctl status mapit-api
```

### WEB VM service

```bash
sudo cp /opt/mapit/deploy/systemd/mapit-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mapit-web
sudo systemctl start mapit-web
sudo systemctl status mapit-web
```

Both services run production preflight checks via:

- API: `npm --workspace=apps/api run start:prod`
- WEB: `npm --workspace=apps/web run start:prod`

## Nginx Installation (WEB VM)

Install Nginx and apply site config:

```bash
sudo apt-get update
sudo apt-get install -y nginx
sudo cp /opt/mapit/deploy/nginx/mapit-web.conf /etc/nginx/sites-available/mapit-web.conf
sudo ln -s /etc/nginx/sites-available/mapit-web.conf /etc/nginx/sites-enabled/mapit-web.conf
sudo nginx -t
sudo systemctl reload nginx
```

Then configure real DNS and TLS cert paths in `mapit-web.conf`.

## One-command VM Install

Run on each VM as root:

```bash
# API VM
sudo /opt/mapit/deploy/scripts/install-vm-services.sh --role api --repo /opt/mapit

# WEB VM
sudo /opt/mapit/deploy/scripts/install-vm-services.sh --role web --repo /opt/mapit
```

The script installs/enables corresponding systemd services and Nginx for WEB role.

## PostgreSQL Replication and Failover

Follow:

- `docs/postgres-primary-replica-runbook.md`

This includes:

- exact `postgresql.conf` and `pg_hba.conf` entries
- base backup and slot setup
- replication health checks
- promotion and API re-pointing steps
- operational failover sequence (`docs/db-failover-checklist.md`)

## Connectivity Checks

- WEB -> API: `curl http://10.10.10.20:3002/health`
- API -> DB Primary: run API startup and a read/write endpoint call.
- DB Replica state:

```sql
SELECT pg_is_in_recovery();
```

Expected on replica: `true`.

## Failover Note

Current app writes to a single `DATABASE_URL` (primary). During failover:

1. Promote replica to primary.
2. Update API `DATABASE_URL` to new primary endpoint.
3. Restart API service.

For smoother failover, use a DB proxy/virtual endpoint later.
