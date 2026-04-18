# PostgreSQL Primary/Replica Runbook

This runbook targets PostgreSQL 15 on Linux VMs.

## Topology

- Primary DB VM: 10.10.10.10
- Replica DB VM: 10.10.10.11
- App DB name: itdocs
- App DB user: appuser
- Replication user: replicator

## 1) Primary VM configuration

### Edit postgresql.conf

Typical path on Ubuntu:

- /etc/postgresql/15/main/postgresql.conf

Set these values:

```conf
listen_addresses = '*'
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
wal_keep_size = '512MB'
hot_standby = on
```

### Edit pg_hba.conf

Typical path on Ubuntu:

- /etc/postgresql/15/main/pg_hba.conf

Add rules (replace CIDR/IP as needed):

```conf
# App access from API VM
host    itdocs        appuser      10.10.10.20/32          scram-sha-256

# Replication stream from replica VM
host    replication   replicator   10.10.10.11/32          scram-sha-256
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### Create database users and DB

Connect as postgres and run:

```sql
CREATE ROLE appuser WITH LOGIN PASSWORD 'replace-with-strong-password';
CREATE DATABASE itdocs OWNER appuser;

CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'replace-with-strong-password';
```

## 2) Create replication slot on primary

```sql
SELECT pg_create_physical_replication_slot('itdocs_replica_slot');
```

## 3) Replica VM bootstrap

Stop service and clear old data dir first.

```bash
sudo systemctl stop postgresql
sudo rm -rf /var/lib/postgresql/15/main/*
```

Take base backup from primary:

```bash
export PGPASSWORD='replace-with-replicator-password'
pg_basebackup \
  -h 10.10.10.10 \
  -U replicator \
  -D /var/lib/postgresql/15/main \
  -R \
  -P \
  -X stream \
  -C \
  -S itdocs_replica_slot
```

Set ownership and start service:

```bash
sudo chown -R postgres:postgres /var/lib/postgresql/15/main
sudo systemctl start postgresql
```

## 4) Verify replication health

### On replica

```sql
SELECT pg_is_in_recovery();
```

Expected: true

### On primary

```sql
SELECT client_addr, state, sync_state, sent_lsn, write_lsn, flush_lsn, replay_lsn
FROM pg_stat_replication;
```

Expected: one row for replica with state streaming.

## 5) Planned failover (promotion)

If primary is down and replica must become primary:

On replica VM:

```bash
sudo -u postgres psql -c "SELECT pg_promote();"
```

Verify:

```sql
SELECT pg_is_in_recovery();
```

Expected: false

Then on API VM:

1. Update apps/api/.env DATABASE_URL to new primary endpoint.
2. Restart API service:

```bash
sudo systemctl restart mapit-api
```

## 6) Rebuild old primary as new replica (after failover)

After old primary is repaired, treat it as a fresh replica:

1. Stop PostgreSQL.
2. Clear old data directory.
3. Run pg_basebackup from new primary.
4. Start service and validate with pg_stat_replication.

## 7) Operational notes

- Always keep primary and replica on same PostgreSQL major version.
- Back up primary regularly (logical dumps and/or WAL archiving).
- Test failover in staging before production.
- Current app writes to one DATABASE_URL; no automatic read/write split is enabled yet.
