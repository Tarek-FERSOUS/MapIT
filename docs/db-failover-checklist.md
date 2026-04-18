# DB Failover Checklist (Operator)

Use this checklist during a primary DB outage when replica promotion is required.

## Scope

- Current app writes to a single `DATABASE_URL`.
- After promotion, API must be re-pointed to the new primary and restarted.

## Preconditions

- Incident declared and on-call assigned.
- Primary is confirmed unavailable or unsafe to continue writes.
- Replica health checked recently.

## T+0 to T+5 min: Confirm state

1. Verify API symptoms: write endpoints failing.
2. Verify old primary is not writable.
3. On replica, confirm still in recovery:

```sql
SELECT pg_is_in_recovery();
```

Expected before promotion: `true`.

## T+5 to T+10 min: Promote replica

On replica VM:

```bash
sudo -u postgres psql -c "SELECT pg_promote();"
```

Validate promotion:

```sql
SELECT pg_is_in_recovery();
```

Expected after promotion: `false`.

## T+10 to T+15 min: Repoint API

1. Edit API env on API VM:

- File: `apps/api/.env`
- Update `DATABASE_URL` host to new primary endpoint.

2. Restart API:

```bash
sudo systemctl restart mapit-api
sudo systemctl status mapit-api --no-pager
```

3. Validate API health:

```bash
curl -f http://127.0.0.1:3002/health
```

## T+15 to T+20 min: Functional validation

1. Login through web app.
2. Execute one write action (e.g., create incident/document).
3. Confirm read-back returns newly written record.

## T+20+ min: Stabilization

1. Communicate service restored.
2. Freeze non-essential schema changes until full postmortem.
3. Start recovery plan for old primary as new replica.

## Post-Incident Actions

1. Rebuild old primary from current primary using base backup.
2. Re-establish replication slot and streaming.
3. Capture timeline, impact, and root cause.
4. Test failover in staging within one week.
