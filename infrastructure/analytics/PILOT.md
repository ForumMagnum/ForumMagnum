# Self-hosted pilot decisions

Authorized pilot, October 1, 2026. User approved up to $500 and delegated network/access choices. The isolated pilot resources have been provisioned; see `pilot/README.md` for resource IDs and current status.

Clarification: connecting the LessWrong application to ClickHouse is not required. Use standalone administrator SQL access. The application continues its existing RDS writes; the importer reads RDS independently. Vercel connectivity is not a blocker for this design.

## Authorized first stage

- AWS account 083919364732, us-east-1, existing LessWrong VPC, isolated pilot resource names/tags.
- One r7i.2xlarge (8 vCPU / 64 GiB), 32 GiB root and 100 GiB encrypted gp3 data volume. This volume is for the sample, not a full-history size recommendation.
- Authorized ceiling: $500 for the pilot, including compute, storage, requests, and networking. Start with at most 24 accumulated instance running hours and review retained resources within one week. This is an operating budget, not an AWS-enforced billing cap. Check the cost projection before starting each phase and reserve allowance for retained resources. Full backfill requires an estimate before committing the remaining allowance.
- Automatic public IPv4 for outbound downloads/AWS APIs, no Elastic IP, no inbound security-group rules, no public database listener. Select and verify an existing subnet with an Internet Gateway route. This replaces the earlier assumption of a private subnet requiring additional outbound infrastructure.
- Administrator-only access through AWS Systems Manager Session Manager/port forwarding. No public SSH port or Vercel integration in the first stage. Required IAM and instance role must be reviewed before creation; existing browser sign-in is not proof of CLI or SSM authorization.
- Read-only bounded samples across historical/recent data and event sizes: start with up to one million events or 2 GiB of uncompressed archived envelopes, whichever comes first. Throttle source reads. Use current fixtures for failure injection; do not install capture on production for the pilot.
- Separate private S3 pilot archive/backup prefixes or buckets. Keep payloads and credentials out of the repository and logs. Pilot data is not the canonical full-history archive.
- Test lossless import, repeat/replay correctness, traffic/breakdown/retention SQL, actual S3 native backup/restore, and EC2 stop/start with nonempty data. Record actual storage, runtime, peak memory, and recovery duration. A bounded sample does not prove full-history performance.
- Stop compute between tests. Review retained disks/S3 and their continuing cost at pilot completion; do not imply that stopping EC2 ends all charges.

## Recorded decisions

1. Spend up to $500 as needed for this pilot; aim to use substantially less for initial validation.
2. Choose sensible networking autonomously: outbound public IPv4 with all inbound ports closed and Session Manager access. Application integration is optional future work and does not gate this pilot or standalone operation.

Instance names, AMI selection, volume mapping, artifact hashes, private bucket names, restricted IAM, and source-role wiring are implementation details to resolve in the concrete infrastructure plan, not questions to delegate to the user.

## Decisions before production ingestion

- Source failure policy: determine whether additional best-effort telemetry loss is acceptable or accepted events require durable retry. The recommended direction is durable retry and stable identities; an in-memory retry loop is not a durability guarantee in serverless processes. This is a separately reviewed writer change, not required to run the read-only pilot.
- Initial backup proposal: preserve canonical raw history, retain daily recovery points for seven days, target approximately daily freshness and recovery within one working day. Confirm these requirements and implement dependency-aware backup retention before scheduled production use. The current implementation does not delete backups automatically.
- Alert recipient and authorized administrator SQL users. Session Manager remains the default standalone access path.
- Full-history storage sizing and recurring/initial-load budget using the pilot evidence; a larger capacity test remains necessary if the sample cannot resolve performance questions.
- Authorization for the concrete source DDL and any application release. The isolated pilot cloud infrastructure is authorized. Pilot authorization does not install a production trigger, merge a production branch, retire RDS, or delete the existing managed service.

References: [Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html), [EC2 addressing](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-instance-addressing.html), [AWS public IPv4 pricing](https://aws.amazon.com/blogs/aws/new-aws-public-ipv4-address-charge-public-ip-insights/).
