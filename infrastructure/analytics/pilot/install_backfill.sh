#!/bin/bash
# Run through a short SSM command after the reviewed Terraform backfill plan.
# This prepares the service; an explicit systemctl start launches the import.
set -euo pipefail
umask 077
cd /opt/lw-analytics
/opt/lw-analytics/venv/bin/python - <<'PY'
import json
from pathlib import Path
import boto3
from pilot.verify import identity_guard
from backfill import check_index_plan, source_identity, validate_job, verify_source, windows
from pipeline import source_connection
from typed_pipeline import initialize_typed
from clickhouse import clickhouse_config
import os
identity_guard()
job = validate_job(json.loads(Path('/etc/lw-analytics/backfill.json').read_text()))
assert job['deadline'] == '2026-10-09T00:00:00+00:00'
assert job['region'] == 'us-east-1'
assert job['archive_bucket'] == 'lw-analytics-pilot-083919364732-20261001'
assert job['source_parameter'] == '/lw-analytics-pilot/backfill-source'
os.environ['ANALYTICS_SOURCE_DSN'] = boto3.client('ssm', region_name=job['region']).get_parameter(
    Name=job['source_parameter'], WithDecryption=True)['Parameter']['Value']
os.environ['ANALYTICS_EVENT_SCHEMA'] = 'typed-v1'
with source_connection() as connection:
    verify_source(connection, job)
    assert connection.execute('SHOW transaction_read_only').fetchone()[0] == 'on'
    check_index_plan(connection, *next(windows(job)))
    print(json.dumps({'source_verified': True, 'source_identity': source_identity(connection)}))
initialize_typed(clickhouse_config('maintenance'))
print(json.dumps({'typed_schema_initialized': True}))
PY
# Never format a retained disk. Grow only the already-mounted expected data volume.
device=$(findmnt -no SOURCE --target /srv/analytics)
[ "$(lsblk -dn -o SERIAL "$device" | tr -d ' ')" = vol046ff1c620d832cfa ]
[ "$(findmnt -no FSTYPE --target /srv/analytics)" = ext4 ]
resize2fs "$device"
install -d -m 700 /srv/analytics/backfill
install -m 644 pilot/lw-analytics-backfill.service /etc/systemd/system/lw-analytics-backfill.service
cat > /etc/systemd/system/lw-pilot-stop.timer <<'UNIT'
[Unit]
Description=Stop unattended analytics at the absolute budget-review deadline
[Timer]
OnCalendar=2026-10-09 00:00:00 UTC
OnBootSec=144h
Persistent=true
Unit=lw-pilot-stop.service
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl restart lw-pilot-stop.timer
systemctl enable lw-analytics-backfill.service
systemctl is-active lw-pilot-stop.timer
systemctl show lw-analytics-backfill.service -p ActiveState -p UnitFileState
printf 'Backfill installed; start explicitly after final checks.\n'
