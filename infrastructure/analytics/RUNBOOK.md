# Operations and rollout

Status: the isolated `pilot/` AWS stack is deployed with its own S3 bucket, encrypted disks, instance role, and stop guards. **No production source capture or application release has been installed.** Waking the existing managed service was separately authorized. Follow [EVIDENCE.md](EVIDENCE.md) for what has actually been measured.

## Before a production rollout

Prepare one review containing the exact AWS plan, monthly comparison and initial-load budget, source migration/rollback, writer-risk decision, and validation results. Obtain authorization for that concrete release before applying Terraform, source DDL, or deploying/merging the application route. The existing repository's `master` push triggers production deployment. Keep `rollout_approved`, `network_and_costs_reviewed`, and `schedules_enabled` false until their corresponding gates are met.

1. Verify all `raw` writers use ordinary origin-mode INSERTs, IDs are non-null/stable, and UPDATE/DELETE/truncate are excluded. Coordinate an append-only contract with source owners. The unique index permits NULL; this implementation rejects NULL instead of inventing identities. Do not take an unbounded production count to check it.
2. Resolve the existing writer's swallowed insertion failures/no retry. Capture is deliberately fail-closed: a queue permission, constraint, or disk failure rolls back source inserts. Since the application currently does not retry them, accepting that behavior can lose analytics before archival. Installing the trigger requires an explicit acceptable-risk/reliability decision; this implementation does not alter the writer.
3. Measure representative source impact and a substantially larger bounded dataset, including large payloads, using controlled resources. Establish full-history query performance for identity-partitioned `FINAL` queries and estimate merge/backfill headroom. The existing managed raw snapshot can guide storage but cannot prove current coverage.
4. Finalize networking. Verify subnet routes, DNS, endpoint policies/SGs, source SG access, S3/DynamoDB/Secrets Manager/SSM reachability, and artifact/package/image downloads. Use standalone administrator access through Session Manager; a Vercel-to-private-gateway path is not required. The currently observed private subnets are insufficient for the supplied internet-based bootstrap; the authorized pilot uses outbound public IPv4, no ingress, and SSM.
5. Choose backup retention, archive retention, recovery target, alarm recipient, daily schedule, and runtime alert threshold. Budget indefinitely retained data and backup chain dependencies. No automatic deletion is configured.
6. Supply a pinned Ubuntu 24.04 amd64 AMI with SSM, encrypted remote Terraform state with locking, two unused bucket names, an existing alert SNS topic, TLS/DNS, and separately provisioned least-privilege secrets. `terraform init -backend=false` was only local validation, not a production state setup.

`deploy/variables.tf` lists mandatory inputs. `data_gib` has no default: select it from measured new-schema size plus merges, staging, and growth. `query_client_security_group_id` must be a real approved client in the VPC path, not a fabricated placeholder. The source identifiers observed in EVIDENCE are candidates to verify in the actual plan, not authorization to change them.

## Credentials and TLS

Use Secrets Manager, never Git, command-line literals, chat, or shell tracing. The worker secret is one JSON object with these keys:

```text
ANALYTICS_SOURCE_DSN
ANALYTICS_CLICKHOUSE_URL
ANALYTICS_GATEWAY_TOKEN
ANALYTICS_CH_INGEST_USER / ANALYTICS_CH_INGEST_PASSWORD
ANALYTICS_CH_QUERY_USER / ANALYTICS_CH_QUERY_PASSWORD
ANALYTICS_CH_MAINTENANCE_USER / ANALYTICS_CH_MAINTENANCE_PASSWORD
tls_certificate
tls_private_key
```

Usernames are `analytics_ingest`, `analytics_query`, `analytics_maintenance`. Passwords and gateway/controller tokens must contain at least 32 unpredictable characters. The separate control secret contains its token as a raw string. The controller never receives database credentials.

Source DSN uses `sslmode=verify-full` with a readable, current AWS RDS CA bundle referenced by `sslrootcert`. Place that non-secret bundle in the reviewed artifact and verify its provenance before use; verification is never disabled. The bootstrap does not download an unpinned CA bundle. The worker enforces TLS and UTC.

The TLS certificate must be trusted by the host and application, and cover `gateway_hostname`. Use private DNS resolving that name to the EC2 private address for clients. Bootstrap adds a host-local override to loopback; `ANALYTICS_CLICKHOUSE_URL=https://<gateway_hostname>:8443` therefore reaches the private local database with correct hostname verification. The application gateway URL is `https://<gateway_hostname>:9443`. Automate/monitor renewal before expiry; restart the relevant services to pick up renewed files. Do not put credentials in URLs or use insecure TLS flags.

Optional future app integration requires `ANALYTICS_CONTROL_URL`, `ANALYTICS_CONTROL_TOKEN`, `ANALYTICS_GATEWAY_URL`, and `ANALYTICS_GATEWAY_TOKEN` in server-only configuration. No application route is included in the standalone change. Grant those secrets only to the intended deployed environment if that integration is requested; preview builds should not wake production compute. Standalone operation does not require any of these application settings.

## Provisioning and initialization after authorization

Build a reviewed release bundle from this directory, excluding `.venv`, caches, `.terraform`, state, private evidence, and credentials. Upload it to the approved private artifact location and set its SHA-256/object ARN/URI in Terraform. Review the entire saved plan, including IAM and changes to the source SG. No Terraform apply command is part of ordinary application CI.

The bootstrap matches the data volume's exact AWS serial. **It never formats a disk automatically.** On first deployment it intentionally stops if the new volume has no readable filesystem. Through the approved SSM/operator path, verify the exact newly created volume ID, its attachment, and that it contains no retained data; only then initialize it with ext4. Never format an existing/unreadable retained volume as a recovery attempt. Rerun the recorded cloud-init user script after initialization; preserve its error output privately. Replacement instances should mount the existing ext4 volume.

The image, SQL/configuration, and Python environment are root-owned. The service user can write only to its state directory and cannot alter the privileged shutdown script or Docker Compose configuration. Check both TLS listeners and role grants; port 8443 is loopback-only and only the approved client SG can reach 9443. Do not open ClickHouse publicly for diagnostics.

On the host, operator commands below assume root and the working directory `/opt/lw-analytics`. Keep secrets out of terminal output. The operator wrapper loads the generated environment as data; never shell-source credential files:

```sh
cd /opt/lw-analytics
export ANALYTICS_STATE_DIR=/srv/analytics/state
systemctl stop lw-analytics
.venv/bin/python deploy/run_cli.py init
```

Initialization uses the maintenance role. Verify read-only query limits and rejected external table functions before enabling users. The source exporter role needs USAGE on `analytics_export`, SELECT/DELETE on its `pending` table, and SELECT on `public.raw`. It must not be the ordinary application's writer or a database superuser. Source-trigger ownership must retain INSERT on the queue; the application writer needs no direct queue permissions.

Run `sql/001_capture.sql` manually against the **analytics RDS source**, after all source-risk gates and release approval. It has a two-second lock timeout and 15-second statement timeout; a timeout rolls back and should be retried during a quieter period after inspecting contention. Never remove those bounds merely to force installation. Test a committed ordinary writer insert, queue visibility, rollback behavior, and trigger bypass assumptions before starting the historical snapshot. Any rejected writer insert requires immediate investigation/rollback.

## Backfill and reconciliation

Install capture first, then take a consistent source export or frozen clone. Prefer a clone when a long repeatable-read transaction would impede vacuum on the primary. Verify the clone includes the capture installation, cannot accept new application writes, and is uniquely identified. Budget its entire lifetime and storage.

```sh
# ANALYTICS_SOURCE_DSN now targets the verified frozen clone.
export ANALYTICS_FROZEN_SOURCE=reviewed-clone-identifier
.venv/bin/python deploy/run_cli.py backfill --source-name "$ANALYTICS_FROZEN_SOURCE"
# After an interrupted export, use the last durable chunk's exact last_id:
.venv/bin/python deploy/run_cli.py backfill --source-name "$ANALYTICS_FROZEN_SOURCE" --resume-after REVIEWED_LAST_ID
.venv/bin/python deploy/run_cli.py replay
```

A chunk checkpoint is published only after its archived data and manifest. Resume requires the same explicitly frozen identity and matching checkpoint. A lost live snapshot cannot be resumed; start a new named snapshot from the beginning and let event identities deduplicate overlap. A bounded `--max-batches` result with `complete_segment:false` is not historical completion. Validate the complete predecessor chain of chunk manifests from the initial cursor through the terminal segment, exact counts/checksums, and coverage of all IDs in that snapshot.

Do not use the September ClickHouse snapshot without independent coverage proof and a lossless export of original payloads into the canonical archive. Derived-only tables cannot substitute for the archive.

During a long clone export, drain the primary queue regularly using a separate scheduled/operator exporter with its own state directory and the correct **primary** DSN. The archive adapter `cli.py export` publishes one pending batch but does not acknowledge it. `cli.py cycle` archives, loads, validates, and acknowledges. Avoid concurrent loaders: the initial design assumes one destination worker. Stop the historical exporter between bounded segments if necessary to run primary cycles; only frozen clones permit this resume pattern.

After historical replay, restore the primary DSN and run `cli.py cycle` until it reports `complete:true`. Compare selected aggregates and exact sampled identities against the captured exports/source. Publish historical coverage separately from cycle completion. Current maximum ID or timestamp is never a freshness proof.

## Wake, status, queries, and retries

Start `lw-analytics` only after initialization and source preparation. Enable schedules only after a successful shadow cycle, native S3 restoration, and real EC2 stop/start test. The daily controller requests import; authenticated user wake requests keep the host available. The external watchdog runs once per minute, including while EC2 sleeps.

Optional future application integration could expose these same-origin endpoints (not installed):

```text
POST /api/adminAnalytics/wake
GET  /api/adminAnalytics/status
POST /api/adminAnalytics/query   {"sql":"SELECT ... FROM analytics.events ...","query_id":"UUID"}
POST /api/adminAnalytics/cancel  {"query_id":"UUID"}
```

Poll status with bounded backoff until `ready`; a wake may return 202 `starting`. Retry 503/queue-full only with a deliberate client retry policy. A queued/active duplicate UUID returns 409. Query admission is one-at-a-time, at most ten pending jobs, with a 30-second queue timeout. Queries are read-only, limited to 120 seconds, 16 GiB, four threads, 10,000 rows, and 8 MiB. Select narrower output when limits reject a query. SQL and result payloads are not written to controller logs.

Read through `analytics.events`, or `analytics.events_typed_v1` after the explicit [typed-schema activation](SCHEMA.md), never bypassing deduplication with raw tables. Use explicit UTC windows with the example queries in `queries/`. Event user/client/tab/session IDs remain separate; NULL/missing fields and original JSON are available for interpretation. Restore clears all versioned receipts: replay every retained schema version before treating its view as reconciled.

For manual retry/inventory, stop the service first and load the protected environment as above:

```sh
.venv/bin/python deploy/run_cli.py inventory
.venv/bin/python deploy/run_cli.py replay
.venv/bin/python deploy/run_cli.py cycle
systemctl start lw-analytics
```

Do not manually delete pending IDs or mark receipts to silence a failure. Oversized/corrupt/conflicting events stay unresolved. Diagnose privately, correct the source contract or supported format in a reviewed release, and replay. Replay after ambiguous outcomes is safe; the receipt is written only after destination reconciliation.

The controller keeps desired wake state for 30 minutes; after it expires, the worker waits for five minutes of true idleness, atomically drains admission, stops ClickHouse gracefully, and powers off EC2 into its stopped state. Heartbeats continue during imports/backups. A wake arriving during shutdown survives in DynamoDB and the watchdog restarts the stopped host. No hard timer terminates active work. If shutdown fails after ClickHouse may have stopped, the gateway remains `failed` and requires operator repair; it does not reopen query admission.

## Backup, restore, and outage recovery

Stop the service for manual operations. Use unique validated names; preserve the recorded base and every dependency for incremental chains:

```sh
.venv/bin/python deploy/run_cli.py backup full-YYYYMMDD
.venv/bin/python deploy/run_cli.py backup inc-YYYYMMDD --base full-YYYYMMDD
```

The worker's initial daily policy creates full backups. It records completion only after ClickHouse reports success and the immutable manifest is written. Configuration/schema live in the reviewed release; secrets remain in Secrets Manager. There is no automatic backup expiration, and canonical archive deletion is not permitted. Native S3 backup completion requires deletion of its temporary `clickhouse/*/.lock` object; the production template still lacks that permission and must have a separately reviewed, narrowly scoped grant before use. Before scheduled use, choose and implement a reviewed retention procedure that preserves a tested full/incremental chain. Backup cleanup must never expire the canonical archive.

On a fresh compatible destination with an empty `analytics` database, mount/configure TLS/roles and recover with:

```sh
.venv/bin/python deploy/run_cli.py restore REVIEWED_BACKUP_NAME
.venv/bin/python deploy/run_cli.py replay
.venv/bin/python deploy/run_cli.py cycle
```

Do **not** initialize a nonempty schema before restore. Restore refuses an existing destination. It clears restored receipts so every archive manifest is reconciled: a backup may have captured receipts and data at different instants. Replay logically deduplicates overlap. Then drain the primary queue and repeat aggregate/identity checks before opening access. If no usable backup exists, initialize a fresh destination and replay the entire retained archive, then recapture any missing history from authoritative RDS.

For a real rollout, prove this flow using the actual S3 backend and an empty replacement instance, and record recovery time. See EVIDENCE.md for the separate cloud pilot validation; full-history recovery on a replacement host still requires a capacity test.

## Alerts and rollback

External alarms cover stale ingestion (>36 hours), overdue backup (>48 hours), worker errors, queued-event age (>36 hours), destination free disk (<100 GiB), low RDS storage (<100 GiB), and excessive running minutes. Missing watchdog health metrics alarm; excessive runtime never kills active jobs. Configure/verify the SNS recipient before enabling schedules. Review service/journal logs privately; error class/status is published without SQL, rows, or credentials.

On ingestion failure, preserve archive and queue state, stop manual overlap, and correct/retry. On low disk, stop adding workloads and expand the reviewed volume or reduce retained temporary data only after its archive is verified. Extending EBS requires filesystem expansion and a revised cost estimate. Never delete canonical history to make the alarm green.

To roll back this integration, disable its schedules, remove the new app configuration/route in an authorized release if deployed, and stop the worker. Existing analytics readers were not switched by this implementation. Retain EBS, S3, queue state, manifests, and source data; Terraform `prevent_destroy` guards the durable resources.

If capture harms source writes, run `sql/002_rollback_capture.sql` against the analytics source with its lock timeout. This removes only the trigger and preserves queued work. Record the exact capture gap. Before resuming, re-establish capture and perform a new consistent recapture covering that gap; incremental pending IDs alone cannot reconstruct inserts made while capture was absent. Do not retire RDS, delete the existing managed service, or purge archived data as part of this rollback.
