# Evaluation evidence — October 1, 2026

## Live read-only findings

The existing ClickHouse service was awakened with explicit authorization for paid compute. Only metadata queries were run: `system.parts` aggregation and `SHOW CREATE TABLE default.public_raw`. The query console was then left for organization usage so preview queries do not keep it awake. Its configured inactivity timeout is 15 minutes. No schema, import, sizing, or retention setting was changed.

Service: Lightcone Infrastructure / LW Analytics, AWS us-east-1, one replica, ClickHouse 26.6, autoscaling 8–120 GiB (2–30 vCPU). Values below are active physical parts on that replica, not distinct logical event counts or a billable backup inventory.

| Dataset | Rows in active parts | Compressed bytes | Uncompressed bytes | Bytes on disk |
| --- | ---: | ---: | ---: | ---: |
| `default.public_raw` | 2,315,652,132 | 135,935,364,137 | 948,873,232,830 | 135,942,865,006 |
| `default.public_lessraw_medium` | 415,314,374 | 58,098,019,957 | 238,138,122,217 | 58,101,118,777 |
| `default.public_lessraw_small` | 284,678,273 | 42,393,455,497 | 169,739,206,509 | 42,395,580,111 |
| All `default` tables | 3,653,784,968 | 273,912,286,099 | 1,624,101,648,960 | 273,931,053,270 |
| `benchmark_full_20260910` | 6,957,648,977 | 224,073,334,088 | 1,833,055,745,342 | 224,114,996,529 |
| `benchmark_acceptance_20260911` | 2,008,157,458 | 53,751,120,358 | 449,156,059,937 | 53,768,914,499 |
| `benchmark_20260910` | 110,300,982 | 3,117,169,277 | 29,913,241,443 | 3,413,238,867 |
| All non-system databases | 12,729,892,397 | 554,853,910,230 | 3,936,226,695,874 | 555,228,204,881 |

There is also a 12-row recovery fixture (1,716 bytes on disk). Database totals include benchmark/staging copies. The new pipeline initially covers only `raw`; none of the other tables is implicitly migrated or deleted. The September snapshot's row count does not demonstrate coverage of current RDS, and its maximum ID would not establish that either.

The raw copy uses `SharedMergeTree ORDER BY tuple()`, with `environment`/`event_type`/`event` strings, `timestamp DateTime64(6)`, `id Nullable(Int64)`, and PeerDB metadata columns. It is not the new deduplicating schema. New envelope, identity, materialized fields, sorting, and partitioning will change compression.

The console showed daily backups with one-day retention, plus five chained backups outside retention totaling approximately 1.1 TB. Those are required chain dependencies, not a measurement of raw-table storage. No backups were removed.

### Observed managed charges

The organization **Usage breakdown** displays list-price gross usage, not a final invoice. For September 9–30 it reported:

| Compute | Storage | Backups | ClickPipes | Transfer | Total |
| ---: | ---: | ---: | ---: | ---: | ---: |
| $24.57 | $9.40 | $9.88 | $156.35 | $0.06 | $200.25 |

Rounding explains a one-cent difference when adding categories. October-to-date at inspection showed $1.66 ($0.27 compute, $0.46 storage, $0.92 backups). This is not the final cost of the authorized wake. Usage pattern, retained data, and importer work differ from the proposed daily pipeline, so neither period is a forecast.

### RDS and network

Read-only SQL found PostgreSQL 15.17, a unique nullable bigint `raw.id` with sequence default, no NULL IDs in an indexed existence check, and no user triggers at inspection. Application code only inserts into `raw`; current statistics showed no updates/deletes, which does not prove the historical contract. Measured raw table/TOAST: 1,071,634,423,808 bytes; indexes: 483,542,687,744 bytes; whole database: 2,498,009,947,495 bytes. No full production table scan was run.

AWS console confirmed account `083919364732`, RDS instance `lw-analytics`, `db.r5d.large` (2 vCPU/16 GiB), us-east-1f, gp3 2,900 GiB/12,000 IOPS/500 MiBps, autoscaling maximum 5,000 GiB, single AZ, encrypted and deletion-protected. VPC `vpc-339c9b48`; source SG `sg-0a0e6d57dc01035c0`. The existing RDS endpoint is publicly accessible; the new worker configuration still requires verified TLS. No RDS configuration was changed.

The VPC console showed **no NAT gateways**. Private route table `rtb-0d37dec0244443abb` associates `subnet-0d56df230c5d8f7d6` (1c) and `subnet-09a6595b4201c28ac` (1a), with only local and S3 gateway routes. Existing endpoints cover S3, Secrets Manager, ECR API/Docker, Logs, STS, and two custom services. No DynamoDB or SSM endpoints appeared in that inventory. Their endpoint SGs/policies and client access were not verified.

Consequences: the supplied bootstrap cannot run in those private subnets as-is (Ubuntu/PyPI/Docker Hub downloads and control/SSM access need a reviewed path). A baked AMI/private ECR plus missing endpoints, or reviewed outbound networking, would need its own concrete change. The application deploys on Vercel, but application integration is optional and its connectivity is not a blocker for standalone SQL access. The authorized pilot uses an outbound public IPv4 address with all inbound ports closed and Session Manager administrator access; this is a deliberate infrastructure revision, not a public database endpoint.

## Local validation

Python fixture suite: **34 passed** including final heartbeat, maintenance initialization, byte-boundary/numeric-ID ordering, and read-only client checks, on PostgreSQL 15.17 and ClickHouse 26.3.38.2. Includes late commits/rollbacks, five crash boundaries, replay conflicts, exact acknowledgements, append-only violations, precision and identity fields, source writer permissions, importer exclusion, full/incremental native restoration followed by archive/pending replay, duplicate query admission, and S3 conditional writes/pagination using AWS SDK stubs. Query-role tests deny raw table access, writes, external table functions, and disabling resource limits.

An optional application prototype passed five tests but was removed from this standalone change. Ruff: passed. Terraform format/validate: passed. Repository typecheck remains blocked by baseline missing Hocuspocus dependencies and the existing `instantInsights` Next configuration type; no analytics route error was reported. The isolated cloud stack was subsequently planned and applied (22 new resources, zero existing resources changed). Its bootstrap, TLS, roles, outbound path, and zero-ingress/loopback listener configuration were verified. Cloud recovery results are recorded below; full-history reconciliation is still outstanding.

A private 300-row sample took the first 100 indexed events from January 1, 2024, January 1, 2025, and September 30, 2026. It covered 18 event types, maximum payload 1,338 bytes. Archive: 41,392 compressed bytes; new ClickHouse table: 96,589 compressed bytes, 108,458 disk bytes. Local import: 1.05 seconds. Traffic query: 41 ms/12.4 MB; breakdown: 19 ms/9.2 MB; retention: 108 ms/31.4 MB (server measurements). Traffic and breakdown total event counts matched the sample; that early check did not reconcile each group or retention. This small sample is a functional smoke test, not a representative large-payload or full-history capacity test. Payloads and credentials remain outside Git.

Synthetic local source test: 50,000 rows without capture and 50,000 with capture, in batches of 1,000. Median/p95 batch latency was 14.40/20.04 ms without capture and 9.66/18.97 ms with capture; warm-cache/order effects dominate, so this does **not** show negative trigger overhead. The 50,000-entry queue occupied 4,521,984 bytes, drained in 0.246 seconds, and was empty after vacuum. Production latency/load and acceptable writer failure behavior remain unproven.

## Cost gate remains open

`cost-inputs.json` deliberately leaves unmeasured fields null; `python cost.py cost-inputs.json` reports missing inputs rather than treating them as zero. Use the same archive and custom importer in both options. September's ClickPipes charge cannot be counted as a saving unique to self-hosting.

For scale only, one running hour/day, a **hypothetical** 500 GiB data disk plus 32 GiB root, and the AWS Price List API-verified $0.5292 EC2 hourly rate gives approximately **$58.67/month for EC2 and EBS alone**. Managed raw storage at the measured 0.13594 TB and listed $25.30/TB-month is about $3.44/month; one 8-GiB compute unit at $0.2985/hour for the same 30.4375 hours adds about $9.09. Eight units instead add about $72.69. These are unequal capacity scenarios, not complete quotes or a claim that one unit can run the workload. [ClickHouse pricing](https://clickhouse.com/pricing), [AWS EBS pricing](https://aws.amazon.com/ebs/pricing/).

Add archive and backup retention/growth, requests, importer execution for managed, monitoring, networking, transfer, source queue capacity, and boot/idle/maintenance hours. Daily full backups without expiration grow continuously; no fixed monthly backup number is defensible until retention is selected. Initial clone/export, compute, transfer, and overlapping storage need a separate budget. The present evidence does not establish that self-hosting is cheaper. Permanent provisioning remains gated on that comparison and the concrete network design.

## Authorized AWS pilot

The user authorized a $500 ceiling and delegated networking. The `pilot/` stack created 22 isolated resources in account `083919364732`; no existing RDS, source security group, app, or managed ClickHouse configuration changed. The host is `i-00e00a3afa7877dc6`, Ubuntu 24.04 on r7i.2xlarge, with encrypted 100 GiB data and 32 GiB root disks. The existing public subnet has a verified Internet Gateway route. No new NAT gateway or VPC endpoint was provisioned.

SSM is online; the live security group has zero ingress and only outbound TCP 443. ClickHouse's effective listener is `127.0.0.1:8443`, with unused MySQL/PostgreSQL/interserver listeners removed and SSH disabled. The pinned image is 26.3.38.2. TLS validates against the explicitly trusted pilot certificate. The query role retains readonly=1 and limited grants; its client omits write-related HTTP settings that readonly mode rejects.

Cloud validation caught and corrected three issues: Ubuntu's unavailable `awscli` apt package (bootstrap now uses packaged boto3), Docker image defaults adding extra listeners (the final overriding config explicitly replaces listen_host), and readonly query requests trying to set async_insert. The byte-limited local test also exposed text ordering of `id::text`; source reads now explicitly sort by numeric `r.id` and use bounded server cursors.

A TLS-verified, read-only, indexed RDS sample contains **1,000,000 events**: the first 250,000 events from each of January 1, 2024, January 1, 2025, September 29, 2026, and September 30, 2026. Extraction took **122.84 seconds**. Versioned envelopes total **763,255,673 bytes**; maximum original payload is **24,152 bytes**; local compressed archive plus manifests total **166,233,375 bytes**. The extraction was capped at one million rows or 2 GiB of envelopes and never installed production capture. This is four partial date windows, not a random sample or full-history coverage.

The immutable archive was uploaded to the private/versioned/encrypted pilot bucket. The first 500,000 events imported and passed per-event hash reconciliation. Native S3 backup testing then exposed ClickHouse's need to delete its temporary `.lock` object. The instance role's existing archive/backup permissions deliberately lack deletion, so the backup failed closed. Temporary deletion access limited to `clickhouse/*/.lock` in the pilot bucket is awaiting explicit approval after automatic approval review rejected it; production IAM has not changed. Query-log and system-flush grants were also rejected and omitted; the pilot uses query-response statistics and container memory measurements instead.

Before the stop/start test, the query view contained **500,000 rows**, with aggregate identity/content fingerprint **9740141812276111259**. A real stop/start preserved the exact 500,000-row count and fingerprint; TLS and the loopback-only listener were rechecked after boot. Final query comparisons below passed; native cloud backup/restore remains permission-blocked.

### Final sample correctness and performance

All **1,000,000** source events loaded across 200 immutable manifests. Replay retained exactly one million logical events with fingerprint **5126686002570470873**. The sample contains 859,642 LessWrong, 125,796 Alignment Forum, 14,002 baserates.org, and 560 development events. Queries deliberately target `lesswrong.com`; an initial empty `production` filter was rejected as irrelevant evidence.

Independent comparison found JSON `null` was becoming the literal string `"null"`, creating a phantom distinct user. Nullable typed JSON extraction now preserves NULL while retaining an actual string ID `"null"`. The pilot's four derived identity columns were rematerialized; raw counts/content fingerprints stayed unchanged. A regression test covers missing keys, explicit nulls, and a literal string ID.

| Query | Result groups | Wall time | Server time | Rows read | Independent comparison |
| --- | ---: | ---: | ---: | ---: | --- |
| traffic | 4 | 75.8 ms | 69.1 ms | 1,000,000 | All groups matched |
| breakdown | 133 | 213.5 ms | 207.2 ms | 1,000,000 | All groups matched |
| retention | 10 | 76.2 ms | 69.6 ms | 2,000,000 | All groups matched |

The resumed import took **163.20 seconds** for the remaining 500,000 rows plus receipt checks on the first half; this is not total initial-load time. A repeat scan of all 200 receipts took **10.53 seconds** and did not inflate counts. One observed ClickHouse container peak was **2,703,155,200 bytes**, including background work/file cache; importer/independent-check peak RSS was **302,743,552 bytes**. These are not per-query peaks. The entire ClickHouse directory later occupied **487,714,816 allocated bytes**, including logs, indexes, metadata, and possibly inactive parts. Concurrent merges can invalidate directory scans, so this is not a compressed-table-size estimate.

The query latencies are single warm measurements on a bounded sample. They do not establish billion-row query latency, full-history storage, daily runtime, or a managed/self-hosted cost winner. The automatic stop guard was invoked successfully and independent local stop timers were active before and after the tested stop/start. Retained disks cost $10.56/month at the verified gp3 rate, plus S3 and small ancillary charges. EC2/public IPv4 running cost is $0.5342/hour. The pilot's $500 ceiling is an operating limit, not an AWS-enforced billing cap.

### Final populated restart verification

After the final artifact/bootstrap update, a second real EC2 stop/start preserved **all 1,000,000 events** and fingerprint **5126686002570470873**. All 147 query result groups matched the independent source calculations again. Post-restart wall times were traffic **220 ms**, breakdown **371 ms**, and retention **77 ms**. The stop timer remained active and ClickHouse still listened only on loopback. The instance was then stopped; AWS confirmed `State=stopped` and `PublicIP=null`. Encrypted EBS and private S3 remain retained.

Private Terraform state is backed up to `s3://lw-analytics-pilot-083919364732-20261001/operator/terraform.tfstate` with bucket encryption/versioning. The host role cannot write that prefix. Final implementation commit and cloud resource identifiers are reviewable in the draft PR; raw payloads and credentials remain outside Git.
