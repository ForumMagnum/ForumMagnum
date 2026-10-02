# Isolated AWS pilot

Authorized October 1, 2026: up to **$500**, networking delegated. Production RDS capture and application deployment are outside this pilot. The main source continues writing to RDS normally.

Final verified state: **EC2 stopped, automatic public IPv4 released; encrypted disks and private S3 retained.**

## Resources

| Resource | Identifier |
| --- | --- |
| Account / region | `083919364732` / `us-east-1` |
| EC2 | `i-00e00a3afa7877dc6` (`r7i.2xlarge`, 8 vCPU / 64 GiB) |
| Ubuntu 24.04 AMI | `ami-0045d7fc2ad003464`, Canonical owner `099720109477` |
| Data disk | `vol-046ff1c620d832cfa`, encrypted 100 GiB gp3 |
| Root disk | Encrypted 32 GiB gp3 |
| S3 | `lw-analytics-pilot-083919364732-20261001`, versioned, encrypted, public access blocked |
| Security group | `sg-0d73687aa98e091f5`, no ingress; outbound TCP 443 only |
| Subnet / route | `subnet-a30b9dac` / main `rtb-262add59` to `igw-6b9bd913` |
| Guard | `lw-analytics-pilot-20261001-guard`, every 15 minutes |

ClickHouse listens only on `127.0.0.1:8443`; SSH is disabled. Use SSM. The instance has no RDS credentials or network permission to read RDS. A bounded read-only source export was uploaded from the administrator machine. The pilot stores generated SQL passwords only in root-readable files on its encrypted disk; secrets and payloads are excluded from Git.

The local systemd timer stops the instance after four hours per boot. The separate AWS guard stops it after four running hours (with up to 15 minutes scheduling delay) or after October 9 UTC. Neither guard starts or terminates it. Stopping retains EBS/S3 and their charges. This is not a billing-enforced spending cap.

## Cost controls

AWS Price List API checked October 1: EC2 $0.5292/hour and gp3 $0.08/GiB-month. Public IPv4 is $0.005/hour while allocated. Combined running EC2/IP cost is $0.5342/hour; 132 GiB of retained disk costs **$10.56/month**. Add S3 storage/requests, Lambda/logs, and any applicable transfer. No NAT gateway or new paid VPC endpoints were created.

Initial scope: one million source events from four indexed date windows, capped at 2 GiB of envelopes. Actual archive evidence is in EVIDENCE.md. These are bounded functional/capacity samples, not full historical coverage. Check retained storage and remaining allowance before enlarging the sample or disk. Review resources by October 8; do not let stopped resources disappear from the cost ledger.

## Access and repeatable operations

Use an authorized AWS profile for account `083919364732`. AWS CLI 2.32+ supports temporary browser sign-in with `aws login --profile lw-analytics-pilot`. Verify account identity before starting anything. No permanent access keys are needed.

```sh
aws sts get-caller-identity --profile lw-analytics-pilot
aws ec2 start-instances --region us-east-1 --profile lw-analytics-pilot --instance-ids i-00e00a3afa7877dc6
aws ssm start-session --region us-east-1 --profile lw-analytics-pilot --target i-00e00a3afa7877dc6
```

Inside the SSM session, use root for the private local client configuration:

```sh
sudo -i
cd /opt/lw-analytics
venv/bin/python - <<'PY'
import json, os
from pathlib import Path
from pipeline import ch, clickhouse_config
os.environ.update(json.loads(Path('/etc/lw-analytics/client.json').read_text()))
print(ch(clickhouse_config('query'), 'SELECT count() FROM analytics.events'))
PY
```

The self-signed pilot certificate is explicitly trusted by this local client through `SSL_CERT_FILE` and covers localhost/127.0.0.1. Certificate verification remains enabled. It expires after 30 days; this configuration is for the short pilot, not a permanent certificate-renewal solution.

Stop after working:

```sh
aws ec2 stop-instances --region us-east-1 --profile lw-analytics-pilot --instance-ids i-00e00a3afa7877dc6
```

`verify.py` requires this exact EC2 identity and bucket, an initially empty pilot analytics database, and an explicit `--allow-pilot-restore` flag for the recovery test. It imports the immutable archive, reconciles every event hash and three independently computed query result sets, writes full/incremental S3 backups, checks repeat/replay, and tests restoration. On the populated pilot, use `--queries-only` for query verification or the explicitly guarded `--resume` option for a recorded interrupted run. Use the saved aggregates to check stop/start survival.

Terraform state is private, excluded from Git, and backed up to the bucket at `operator/terraform.tfstate` (encrypted and versioned). The host role cannot write that prefix. Preserve the reviewed state and lock file; do not reapply this stack with empty state. Never use `terraform destroy` as a cleanup shortcut: data volume and bucket are protected. Cleanup must identify retained archive/backup dependencies and explicitly choose what to retain or delete.
