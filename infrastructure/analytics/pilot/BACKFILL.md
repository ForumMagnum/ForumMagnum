# Unattended twelve-month backfill

Requested October 2, 2026 (Pacific): run the import without depending on the operator's laptop, initially for the last twelve months. The existing $500 authorization and delegated network setup apply. **Prepared and tested locally; not launched. AWS authentication must be refreshed before applying or starting anything.** No source role, network rule, volume expansion, timer change or service installation has been applied for this backfill yet.

The intended fixed interval is `[2025-10-03 01:00:00 UTC, 2026-10-03 01:00:00 UTC)`. It is split into 1,460 six-hour windows, newest first. The source's October 3 query-plan estimate for the nearly equivalent October 2-to-October 2 year was 488,574,865 rows; this is a planner estimate, not a counted total. Six-hour extraction uses the existing timestamp B-tree index. The worker refuses a sequential-scan plan.

## Execution and correctness

`backfill.py` runs under `lw-analytics-backfill.service` on the existing isolated EC2 host. Source TLS uses the RDS CA bundle and `verify-full`. A dedicated login must have SELECT access to `public.raw` and no INSERT/UPDATE/DELETE/TRUNCATE privileges. Its DSN is fetched from the encrypted SSM parameter `/lw-analytics-pilot/backfill-source` through the instance role. The job also checks a hash of the actual source endpoint, port and database against its fixed configuration. No local AWS credentials, laptop proxy, browser session or SSH tunnel is used by the worker.

Each window uses a separate repeatable-read, read-only PostgreSQL transaction, with bounded fetches, 50,000-row/64-MiB archive batches, and query/idle timeouts. Original JSON remains in the immutable S3 archive and typed destination. The typed loader verifies identities and content before and after insertion. A window checkpoint is written only after source EOF and all ClickHouse receipts. An interrupted window is read again from its beginning; stable event identities prevent duplicate counts. Completed windows are reconciled from their manifest receipts and skipped on the source. The local file lock prevents competing imports on this host.

Coverage means **all rows visible in each individual window's snapshot**. It is not one global snapshot of the year, and completed windows do not include commits or backdated events arriving after their snapshot. Catch-up is a separate operation. This job installs no capture trigger and does not change the LessWrong application or production writer. PostgreSQL's [repeatable-read documentation](https://www.postgresql.org/docs/15/transaction-iso.html) describes these snapshot semantics.

## Resource limits

The reviewed backfill configuration expands the retained data volume from 100 to 512 GiB. The importer reserves at least 64 GiB or 20% free space, whichever is larger, and stops for review rather than filling the disk. The service has an 8-GiB memory limit and two CPU cores' worth of CPU time; ClickHouse has the rest of the host. It retries transient failures at most five starts within 30 minutes, then stops the host. Completion and explicit resource-limit stops also stop the host. The enabled service can resume on a later boot.

The independent AWS guard and local timer retain an absolute October 9, 2026 00:00 UTC deadline, with at most 144 running hours per boot. Neither starts or terminates the host. A stopped instance retains EBS and S3. Using the October 1 API-verified EC2/IP rate, 144 running hours is about $76.92. The planned 544 GiB total EBS is $43.52 per month at [$0.08/GiB-month](https://docs.aws.amazon.com/en_en/emr/latest/ManagementGuide/emr-plan-storage-compare-volume-types.html), plus S3, requests and any transfer. Recheck live pricing/state and prior spending before applying; these controls are not an AWS billing cap. Review retained storage after the import.

## Deployment order

1. Authenticate to AWS account `083919364732` and inspect the current named EC2, EBS, source RDS and security groups. Refresh the private Terraform state if needed; never apply with empty state.
2. Apply the reviewed `pilot/main.tf` plan with `-var-file=backfill.tfvars`. It expands the existing disk, adds only the host-to-source SG path on TCP 5432, permits coverage checkpoints, grants source parameter retrieval, and extends the scheduled stop guard. Review for replacements or unrelated changes before applying. Preserve the encrypted/versioned private state backup.
3. Provision the dedicated SELECT-only source login with a random password and bounded connection/statement settings. Store its TLS DSN as an SSM SecureString without printing it or committing it. No broader administrator database credentials belong on EC2.
4. Upload the tested release bundle by content hash, start the existing host, and use a short SSM command to verify the bundle and install it. Update the ClickHouse role configuration and restart its container. Install the public RDS CA bundle at `/etc/lw-analytics/rds-ca.pem`.
5. Install the reviewed `pilot/backfill-job.json` as root-only `/etc/lw-analytics/backfill.json`; it contains the fixed interval, source identity, region, archive bucket, parameter name, extractor fingerprint, six-hour windows, 50,000 batch rows, free-space reserve and deadline. Run `pilot/install_backfill.sh`: it verifies source identity/permissions/index plan, initializes the separate typed schema, safely grows the existing ext4 filesystem, and installs/enables the service and timer. It does not launch the importer.
6. Start `lw-analytics-backfill.service` through SSM and let that command return. Check subsequent S3 status and window checkpoints from a separate request. Verify a controlled interruption/restart does not inflate counts before leaving the full run unattended.

No PR merge or app deployment is required.

## Operation

On the EC2 host through SSM:

```sh
sudo systemctl status lw-analytics-backfill.service
sudo journalctl -u lw-analytics-backfill.service -n 15 --no-pager
sudo cat /srv/analytics/backfill/status.json
sudo systemctl start lw-analytics-backfill.service
```

Progress is also at `s3://lw-analytics-pilot-083919364732-20261001/evidence/<job-name>/status.json`, independently of the laptop. It reports completed-window rows separately from the current incomplete window. Immutable checkpoints are under `coverage/<job-name>/windows/`; `coverage/<job-name>/complete.json` exists only after every window is complete. After restoring ClickHouse, clear versioned import receipts along with rebuilding tables, as in the existing restore procedure, then rerun to reconstruct from archive.

Stopping the service can trigger host shutdown through its unit dependencies. To stop costs immediately, stop the named EC2 instance in AWS; all committed windows and archived batches survive. To keep the server up for investigation, temporarily suppress the service's `OnSuccess`/`OnFailure` shutdown dependency with an operator override, retaining the independent deadline guard.

Changing the source, interval, extractor or window size requires a new job name. Operational disk/deadline limits can be changed without rewriting coverage. A new job overlaps safely through canonical event identities, but it must not claim old checkpoints as coverage for a new interval.

## Validation

All 70 analytics fixture tests pass, including eight new backfill tests. The backfill checks cover half-open boundaries, equal timestamps, each crash boundary, lower-ID late commits after an interrupted snapshot, completed-window reuse, immutable job identity, disk/deadline stops and typed replay. Terraform validates, shell syntax and Ruff pass. Cloud installation, restricted-role verification and detached progress remain unverified until AWS access is restored.
