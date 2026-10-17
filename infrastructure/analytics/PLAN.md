# LessWrong analytics: self-hosted ClickHouse implementation plan

Draft — 2026-10-01. Replaces the earlier multi-engine evaluation plan. This document records the original design proposal. The authorized isolated pilot is now provisioned; see PILOT.md and EVIDENCE.md for current execution status. Production ingestion has not changed.

## Decision and scope

Use a single self-hosted ClickHouse server over the existing RDS `analytics.public.raw` table. Keep RDS as the ingestion source initially, with a later path to application ingestion into S3 and retirement of analytics RDS. Wake ClickHouse for a daily import and on-demand queries, then stop the server while idle.

Design the pipeline around a durable S3 event archive from the start: an RDS exporter produces archived batches, and a separate loader consumes them into ClickHouse. Later, replace the exporter with application ingestion while retaining the archive format, loader, and recovery path. RDS retirement is a later planning phase, not part of the initial deployment.

The workload is mostly idle, with occasional interactive exploration and approximately daily freshness acceptable. Start with one analyst query at a time, queued additional requests, and full historical retention. These are operating defaults, not measured capacity guarantees. There is no automatic failover: restore or repair the analytics server after failure.

**The cost condition remains open.** Sleep stops compute billing, but retained disk still costs money. Measure storage and calculate the complete estimate before provisioning the permanent deployment. Managed ClickHouse using the same custom importer remains the cost comparator; excluding ClickPipes from only one side overstates self-hosting's savings.

Deliverables: infrastructure configuration, schema, ingestion/backfill tools, wake/sleep control, focused tests, and an operating runbook. No further StarRocks/PostgreSQL benchmark campaign is planned. Work is organized by deliverables, without historical engineering-effort estimates.

## Existing evidence

Measurements recovered or taken during the September 30–October 1 investigation:

| Observation | Interpretation |
| --- | --- |
| RDS `raw`: 1,071,611,535,360 bytes table/TOAST; 483,533,914,112 bytes indexes | About 1.07 TB plus 0.48 TB; this does not predict ClickHouse compression |
| Whole PostgreSQL database: about 2.50 TB | Includes tables outside this pipeline |
| September 9 ClickPipes snapshot: 216 tables, UI reported 1.51 TB | Historical import figure, not verified compressed storage for `raw` |
| That snapshot's `public_raw`: 2,315,652,132 rows | Historical loaded count, not today's source count |
| Source `id`: bigint, nullable, unique index, no primary key | Establish a non-null, stable identity before relying on ID-based ingestion |
| Logical replication disabled | The proposed queue avoids enabling it; WAL-based CDC requires separate preparation |

The existing service is `LightconeInfrastructure / LWAnalytics`; the pipe was “Lesswrong Analytics Initial Load.” Reuse its schema and historical data only after verifying coverage and compatibility. The [prior benchmark report](https://lightconeteam.slack.com/files/U029THNKHR9/F0C1G25L62Y/dashboard.html) supplies query examples, not a proven memory requirement or daily running time.

## Architecture

```text
Application → existing RDS raw table
                    └─ transactional pending-ID queue
                                  ↓ daily export worker
                        Durable S3 event archive / manifests
                                  ↓ reusable batch loader
                         ClickHouse on one EC2 host
                                  ↑
                       authenticated query service

Daily schedule / authenticated wake → start EC2 → readiness check
Idle controller → drain work → stop ClickHouse cleanly → stop EC2
ClickHouse + import metadata → S3 backups
```

- **Compute:** provisionally `r7i.2xlarge`, 8 vCPU / 64 GiB, Linux on demand in `us-east-1`. Resize after the focused checks.
- **Storage:** encrypted gp3 EBS with headroom for merges, staging, logs, and growth; retain the data volume when replacing the instance. Separate the durable S3 raw-event archive from ClickHouse backups and temporary staging. Archive retention follows the chosen data-retention policy, independently of backup expiration.
- **Services:** pinned ClickHouse release and one worker under systemd or Docker Compose on the same host. No Kubernetes, Kafka cluster, or continuously running ingestion server initially.
- **Access:** private database endpoint, TLS, separate ingestion and read-only query roles, credentials outside Git. Use standalone administrator access through Session Manager. Application connectivity is optional future work. Authenticate wake requests as well as queries.
- **Control:** EventBridge schedule and a small serverless wake/status function. Include any dedicated NAT gateway, VPC endpoint, or load balancer in the estimate before adding one.

EC2 preserves EBS data while stopped. Boot and ClickHouse readiness introduce a user-visible wait; measure it instead of promising immediate queries. [AWS stop/start documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Stop_Start.html).

## 1. Verify sizing and cost

Read the existing ClickHouse schema and active-part metadata: rows, compressed bytes, uncompressed bytes, and bytes on disk. Measure one replica's dataset rather than summing replicas. Inventory every table to copy, including enrichment and staging. [ClickHouse `system.parts`](https://clickhouse.com/docs/operations/system-tables/parts).

If that data cannot be measured or reused, load a bounded representative slice into the proposed schema. Include ordinary and large-payload events. Label extrapolated full-history storage provisional, and check real headroom during backfill.

The earlier scenario assumed 1 TB compressed data, roughly 1 TB of backups, 2,000 GB provisioned gp3 disk, and 1–2 running hours/day:

| Item | Illustrative monthly amount |
| --- | ---: |
| EC2 at $0.5292/hour | $16–32 |
| gp3 at $0.08/GB-month | $160 |
| S3 backup allowance | $25 |
| **Core self-hosted subtotal** | **$201–217** |

Add the root disk, durable raw archive, temporary staging, requests, monitoring, networking, transfer, and incremental RDS queue capacity. The archive is an additional retained copy; its compressed size may differ from ClickHouse's and is not included in the $25 backup allowance. Running time includes imports, queries, backups, boot, idle grace, and maintenance. EBS remains billed while asleep. These are scenario inputs, not a quote. [EC2 pricing](https://aws.amazon.com/ec2/pricing/on-demand/), [EBS pricing](https://aws.amazon.com/ebs/pricing/), [S3 pricing](https://aws.amazon.com/s3/pricing/).

Earlier managed scenarios were approximately $233–269/month with ClickPipes, before ingestion-volume fees, or $87–123 with our batch importer, before importer execution and ancillary costs. Availability and per-node memory differ. Recalculate both with measured storage and expected running time. [ClickHouse pricing](https://clickhouse.com/pricing), [ClickPipes billing](https://clickhouse.com/docs/products/cloud/reference/billing/clickpipes/clickpipes-for-cdc).

**Deliverable:** recurring-cost estimate and separate initial-load budget covering temporary export resources, compute, transfer, and overlapping storage. If self-hosting costs more than the comparable managed option, present the difference when selecting permanent capacity. The user subsequently authorized up to $500 for the isolated pilot and delegated networking choices.

## 2. Implement reliable daily ingestion

### Proposed source change: transactional pending-ID queue

Create a queue table in analytics RDS. An `AFTER INSERT` trigger records each new `raw.id` in the source transaction. Prefer a statement-level trigger with a transition table to batch inserts. The source row and queue entry commit or roll back together. [PostgreSQL trigger semantics](https://www.postgresql.org/docs/15/trigger-definition.html).

Read committed pending entries and fetch their raw rows through the ID index. Delete only the exact entries successfully delivered. Never use `MAX(id)` or event time as a completeness checkpoint: an older ID committing late must remain eligible for the next batch.

This is a production schema change with ongoing write/storage cost. First verify that `raw` is append-only, IDs are non-null and immutable, and all writers fire the trigger. If updates or deletes occur, extend capture and destination semantics before rollout. Measure trigger overhead, queue growth, and vacuum behavior. Install with a short DDL lock timeout and retry rather than indefinitely blocking writes.

The current [analytics writer](../../packages/lesswrong/server/analytics/serverAnalyticsWriter.ts) catches insertion failures without retry. A trigger failure could therefore lose source analytics. Test permissions and failure behavior, monitor insert errors, and prepare immediate trigger rollback. Resolve unacceptable source-loss risk before installation.

If this approach fails the source-impact or correctness checks, use a tested WAL-based CDC consumer and revise the plan and estimate. That alternative needs logical replication setup, restart planning, durable offsets, and retained WAL for sleep and failures. [RDS logical replication](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL.Concepts.General.FeatureSupport.LogicalReplication.html).

### Batch delivery and destination

1. Acquire a single-worker lease. Read bounded sets of committed pending IDs and their rows without holding source locks during network delivery.
2. Write immutable archive files and manifests to S3: exact event IDs, source IDs, schema version, row count, and checksum. Start with lossless compressed newline-delimited JSON; introduce derived Parquet only when useful.
3. Have the independent loader insert synchronously into ClickHouse, validate delivery, and persist import status before acknowledging those source queue entries. Track archive publication separately from ClickHouse application so the source adapter can change later.
4. Retry ambiguous outcomes safely. A crash after insertion but before acknowledgement may replay rows; query results must remain correct.
5. Retain the raw archive for its agreed retention period, even when ClickHouse backups cover it. Expose invalid rows and failed batches as unresolved work rather than silently reporting success.

Define a canonical event identity now: historical events can use `rds:raw:<id>`, while new producers can supply a stable UUID generated once before delivery and preserved across retries. Keep the original RDS bigint separately. During a future dual-write period, both paths must use the same producer event ID; the RDS exporter must prefer that ID when present. Archive envelopes also carry event time, received time, environment, event type, and schema version. Track imported object identities durably and reconcile object inventory so late-arriving files are not skipped by a last-filename cursor.

Preserve source fields and the raw JSON payload, adding typed columns for the first useful queries. Preserve bigint/numeric precision, UTC timestamp interpretation, null/missing distinctions, and separate user/client/tab/session identities.

For the append-only contract, use `ReplacingMergeTree` with a stable sorting key containing canonical event ID and only immutable fields. Evaluate monthly event-time partitions and a sort key beginning with environment/event type/time. Serve through a canonical view using `FINAL` or another tested deduplication query. Background merges alone do not ensure correct counts. Avoid aggregate materialized views over duplicate arrivals initially. [ReplacingMergeTree semantics](https://clickhouse.com/docs/engines/table-engines/mergetree-family/replacingmergetree).

## 3. Backfill without a gap

Install capture before establishing the historical export snapshot. Export that consistent snapshot into the durable S3 archive in resumable chunks while the queue captures concurrent inserts. Historical and queued data can overlap; deduplicate at the destination. A reused ClickHouse snapshot must also yield the complete original event payloads for archival; copying only derived columns is insufficient for eventual RDS retirement.

Choose a controlled export on RDS or a temporary snapshot/clone if a long transaction would harm the primary. Include temporary resources in the initial-load budget. Use streaming extraction and source-load limits; avoid ad hoc full-table counts on live RDS.

The September ClickHouse copy may save export work if coverage is verifiable, but its largest ID alone does not prove a complete history. Otherwise take a new consistent export. Drain the queue during a long backfill so it does not grow without bounds.

Preserve chunk manifests and compare counts/checksums against captured exports. Validate selected full-history aggregates after catch-up. Publish historical coverage separately from the last completed ingestion cycle; maximum event timestamp and maximum ID do not prove freshness.

## 4. Add wake, sleep, and recovery

- **Daily wake:** start at a configurable time, wait for health, import work, and publish cycle completion. Failed or unusually long runs show stale status.
- **Query wake:** authorize before starting EC2. Return “starting” and poll readiness instead of holding a serverless request through boot. Apply query timeouts, cancellation, and resource limits.
- **Safe sleep:** after idle grace, atomically enter draining state so new requests wait or retry. Finish queries, imports, and backups; persist progress; stop ClickHouse gracefully before EC2. Test wake requests racing with shutdown. Allow maintenance time without requiring every possible background merge to finish before sleeping.
- **Backups:** ClickHouse-aware full/incremental S3 backups plus schema/configuration and manifests. Preserve a usable base and dependent increments. Expire temporary staging only after durable archival is confirmed; backup rotation must never expire the canonical raw archive. Test restoration to an empty instance. [S3 backup/restore](https://clickhouse.com/docs/operations/backup/s3_endpoint).
- **Monitoring:** an external scheduled watchdog runs while EC2 sleeps. Alert on failed imports, overdue backups, queue growth, low source/destination disk, and excess running hours. Cost alerts must not abruptly kill active imports.
- **Recovery:** restore a backup, replay later archived batches, then drain the pending queue. Measure recovery time. RDS remains authoritative, allowing a full rebuild when necessary.

## 5. Focused validation

| Check | Required result |
| --- | --- |
| Ingestion fixture | Late commits, rollbacks, duplicate retries, and crashes at acknowledgement boundaries cause no missing or duplicated logical rows |
| Source impact | Representative batched inserts remain acceptable; queue draining/vacuum keep up; trigger failures are visible |
| Data and queries | One representative import plus traffic, filtered-breakdown, and cohort/retention queries; record latency, memory, disk, and import time |
| Sleep/wake | Data survives stop/start; readiness is accurate; concurrent requests and shutdown races do not lose active work |
| Restore/replay | A fresh instance reconstructs expected rows from backup, batches, and pending queue |

Use small fixtures for failure tests and reuse prior SQL. Extend performance testing only when a failure or unresolved capacity question warrants it. After backfill, verify full-history storage and a real daily cycle before treating the cost model as established.

## Rollout and completion

Check infrastructure definitions, versioned SQL, worker, control endpoints, tests, and runbook into the appropriate existing infrastructure repository after verifying ownership. Keep credentials and payloads out of Git. Application changes cover authenticated queries, wake/status, and any separately reviewed writer reliability fix.

Prepare a reviewable rollout with exact resources, source DDL/rollback, costs, and test evidence. Obtain authorization for the concrete production changes before applying them. Start with shadow queries, then enable analytics users after reconciliation and recovery pass.

Rollback redirects analytics reads and disables scheduled imports while preserving RDS, queue state, and replay data. If the source trigger must be removed to protect ingestion, record the capture gap and arrange consistent recapture before resuming. Retiring RDS or deleting the existing ClickHouse service is outside the initial rollout.

Completion means daily ingestion and on-demand queries work, idle compute stops billing, source impact is acceptable, restore/replay is demonstrated, and measured storage/running time support the agreed cost. The handoff includes the monthly projection and commands for wake, status, retry, backup, restore, and rollback.

## Later phase: ingest into S3 and retire analytics RDS

Proposed end state:

```text
Application → authenticated ingestion → durable buffering/batching → S3 archive
                                                                      ↓ daily
                                                                  ClickHouse
```

S3 becomes the authoritative event history; ClickHouse is rebuildable query storage. New events can be accepted while ClickHouse is stopped. The ingestion path must remain available independently of that sleeping machine.

**Collection options:** evaluate Amazon Data Firehose as a low-operations delivery layer. It buffers records into S3 objects, avoiding one tiny object per event. Alternatively, write existing application batches directly to S3 if request volume, file sizes, retry behavior, and durability are adequate. Serverless process memory must not be the only place holding accepted events. [Firehose delivery](https://docs.aws.amazon.com/firehose/latest/dev/basic-deliver.html).

With Firehose, check per-record batch errors and preserve event IDs through retries. Successful acceptance precedes S3 delivery, so monitor delivery failures: its documented Direct PUT retention is 24 hours, not an unlimited durable archive. Decide whether that recovery window is sufficient or add a longer-lived replay buffer. [PutRecordBatch behavior](https://docs.aws.amazon.com/firehose/latest/APIReference/API_PutRecordBatch.html).

Migration steps:

1. Add stable producer event IDs and deploy the new writer behind a switch. Keep source normalization identical on both paths so deduplication keys remain stable.
2. Run a bounded overlap with RDS and S3 delivery. Dual writes are not atomic: track acknowledgements separately and reconcile exact event IDs, missing payloads, and failed deliveries before trusting the new path.
3. Finish and verify historical archival, including the final RDS tail. Demonstrate rebuilding ClickHouse from S3 alone and handling new, duplicate, and delayed objects.
4. Inventory every RDS reader, writer, job, and non-`raw` table. Migrate required consumers or retain their database; moving `raw` alone does not establish that the whole instance can be removed.
5. Switch authoritative ingestion, stop RDS event writes, and observe a defined validation period. Retain a final snapshot and a tested rollback path. Reverting writes to RDS must also replay events accepted only by S3 during the cutover.
6. Retire RDS only after reconciliation, dependency migration, and authorization for that specific decommissioning.

Recalculate total cost as ClickHouse plus archive, backups, delivery/batching, requests, and transfer, less the RDS resources actually retired. Include producer record-size billing and object counts; do not assume the delivery layer is free. [Firehose pricing](https://aws.amazon.com/firehose/pricing/). This phase is a migration option, not a commitment to perform it now.
