# Archived analytics implementation

Implementation of [the October 1 plan](PLAN.md) in ForumMagnum, which owns the existing analytics writer. **An isolated AWS pilot is deployed; production ingestion is not enabled.** Read [measured evidence and open gates](EVIDENCE.md) before considering a rollout, and use [the runbook](RUNBOOK.md) for operations.

The pipeline publishes immutable compressed event batches to S3 before loading ClickHouse. A transactional PostgreSQL pending-ID queue captures late commits without relying on a maximum ID. Only validated, synchronously inserted, durably receipted batches acknowledge exact source IDs. The canonical query view uses `FINAL`, so replay does not inflate counts. Original JSON text and bigint precision are preserved.

The opt-in [typed event schema](SCHEMA.md) promotes 142 selected properties and eight browser intervals, retaining original JSON and explicit missing/null/invalid/source metadata. It uses a separate versioned destination and grouped archive replay; the default remains the legacy pilot layout. Selection, semantics, validation and activation instructions are in that document.

`archive.py` owns the versioned envelope/storage format; `pipeline.py` contains the RDS adapter and reusable loader. `operations.py` handles native backup/restore. `service.py` provides a private authenticated query gateway, daily worker, independent heartbeat, and graceful idle shutdown. `cloud_control.py` provides the authenticated serverless wake/status controller and external watchdog. Source DDL is manual and is deliberately outside application migrations.

`deploy/` describes one private EC2 host with a retained encrypted EBS volume, two protected S3 buckets, DynamoDB control state, Lambda, disabled-by-default schedules, and alarms. It does not silently add paid networking. An approved subnet, outbound path, trusted TLS hostname, source role, secrets, and cost estimate are prerequisites for scheduled production use. The separate `pilot/` stack uses no inbound rules and SSM access.

Optional future application endpoints would be `/api/adminAnalytics/{wake,status,query,cancel}`. Such an integration should require a LessWrong administrator, enforce same-origin POSTs, and use server-side endpoint/token configuration. They are not required for the standalone deployment: administrator SQL access can use Session Manager port forwarding. No existing analytics reader is switched and no analyst UI is added. Application integration is future work and no app route is included in this change.

## Local validation

Use Python 3.12+ and install `requirements.lock` in an isolated virtual environment. The integration fixtures require PostgreSQL 15 and ClickHouse 26.3.38.2, with the latter image pinned in `deploy/compose.yaml`. Never point tests at a shared database. Integration setup deliberately drops fixture tables/database, and rejects other source database names and destination endpoints.

```sh
python -m pytest tests -q
ruff check .
# Opt-in integration: local PostgreSQL analytics_fixture on 58439 and
# ClickHouse on 58123. Credentials belong to these disposable fixtures only.
ANALYTICS_INTEGRATION=1 \
ANALYTICS_SOURCE_DSN='postgresql://postgres:local-fixture-only@127.0.0.1:58439/analytics_fixture' \
ANALYTICS_CLICKHOUSE_URL='http://127.0.0.1:58123' \
ANALYTICS_CH_INGEST_USER=fixture \
ANALYTICS_CH_INGEST_PASSWORD=local-fixture-only \
python -m pytest tests -q
```

For native backup tests, configure a disposable ClickHouse `backups` disk and set `ANALYTICS_NATIVE_BACKUP=1`. For role tests, load `deploy/users.xml` with the three fixture passwords set to 32 `q` characters, retaining a separate full-access `fixture` user; set `ANALYTICS_TEST_ROLES=1`. Container bridge tests require fixture-only network permissions; production users remain loopback-only. The role tests use no production credentials.

`measure.py PRIVATE_SAMPLE.json --private-archive PRIVATE_DIRECTORY` measures a bounded private source sample in the disposable destination. The source JSON is an array of objects with `id` (string), `environment`, `event_type`, `event_time`, and `event_json` (original JSON text). `measure_source.py` measures 50,000 synthetic inserts with and without capture and drains/vacuums the queue. Both require `ANALYTICS_TEST_MODE=1`; neither is a production benchmark.

`terraform -chdir=infrastructure/analytics/deploy validate` checks the infrastructure definitions after `init -backend=false`; this is not a live plan.

## Decisions and limits

- Identity hashing into 16 partitions and ordering by event ID prioritize global replay correctness and efficient conflict checks. This differs from the plan's provisional date partition/sort layout. Full-history query performance remains a rollout gate; the one-million-row pilot cannot establish it.
- Source is append-only. Updates, deletes, trigger bypass, NULL IDs, oversized rows, or conflicting identities require intervention. Nothing silently skips these failures.
- One worker process and one admitted job/query at a time. Manual CLI jobs require stopping the service. A process lock plus source advisory lock prevent concurrent importers; they are not a multi-host failover protocol.
- Receipt lookup avoids re-insertion but inventory scans all manifest keys, including late arrivals. Test its cost at full archive scale.
- Backups default to daily full backups. There is no automatic deletion or lifecycle expiration. Agree a retention policy and budget its growth before enabling schedules.
- EC2 failure recovery is manual. The raw archive and retained source are the recovery boundary; no automatic failover or RDS retirement is included.
