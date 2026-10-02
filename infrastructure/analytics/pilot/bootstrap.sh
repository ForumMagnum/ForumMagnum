#!/bin/bash
set -euo pipefail
umask 077
# Independent local guard, recreated on each boot and backed by the AWS guard.
cat > /etc/systemd/system/lw-pilot-stop.service <<'UNIT'
[Unit]
Description=Stop the analytics pilot after four hours
[Service]
Type=oneshot
ExecStart=/sbin/shutdown -h now
UNIT
cat > /etc/systemd/system/lw-pilot-stop.timer <<'UNIT'
[Unit]
Description=Bound pilot compute runtime
[Timer]
OnBootSec=4h
Unit=lw-pilot-stop.service
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now lw-pilot-stop.timer
sed -i 's|http://|https://|g' /etc/apt/sources.list.d/ubuntu.sources
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker.io docker-compose-v2 python3-venv python3-boto3 nvme-cli acl
systemctl enable --now docker
mkdir -p /opt/lw-analytics /etc/lw-analytics/tls /srv/analytics
chmod 755 /opt/lw-analytics /srv/analytics
python3 - <<'PYDOWNLOAD'
import boto3
boto3.client('s3', region_name='us-east-1').download_file('${bucket}', '${artifact_key}', '/tmp/analytics.tar.gz')
PYDOWNLOAD
echo '${artifact_sha256}  /tmp/analytics.tar.gz' | sha256sum -c -
tar -xzf /tmp/analytics.tar.gz -C /opt/lw-analytics
chmod -R go-w /opt/lw-analytics
python3 -m venv /opt/lw-analytics/venv
/opt/lw-analytics/venv/bin/pip install --disable-pip-version-check -q -r /opt/lw-analytics/requirements.lock
# This volume is newly created by this isolated pilot stack, never a retained source.
expected='${volume_id}'
expected_no_dash=$(echo "$expected" | tr -d '-')
device=''
for attempt in $(seq 1 120); do
  for candidate in /dev/nvme*n1; do
    serial=$(lsblk -dn -o SERIAL "$candidate" | tr -d ' ')
    if [ "$serial" = "$expected_no_dash" ]; then device="$candidate"; break; fi
  done
  [ -n "$device" ] && break
  sleep 5
done
[ -n "$device" ] || exit 1
if ! blkid "$device" >/dev/null 2>&1; then
  [ -z "$(wipefs -n "$device")" ] || exit 1
  mkfs.ext4 -q "$device"
fi
[ "$(blkid -s TYPE -o value "$device")" = ext4 ] || exit 1
uuid=$(blkid -s UUID -o value "$device")
echo "UUID=$uuid /srv/analytics ext4 defaults 0 2" >> /etc/fstab
mount /srv/analytics
mkdir -p /srv/analytics/clickhouse
chown 101:101 /srv/analytics/clickhouse
openssl req -x509 -newkey rsa:3072 -nodes -sha256 -days 30 -subj '/CN=localhost' -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1' -keyout /etc/lw-analytics/tls/analytics.key -out /etc/lw-analytics/tls/analytics.crt 2>/dev/null
chmod 755 /etc/lw-analytics /etc/lw-analytics/tls
chmod 644 /etc/lw-analytics/tls/analytics.crt
setfacl -m u:101:r /etc/lw-analytics/tls/analytics.key
python3 - <<'PY'
import hashlib, json, secrets
from pathlib import Path
values = {'ANALYTICS_CLICKHOUSE_URL': 'https://localhost:8443', 'SSL_CERT_FILE': '/etc/lw-analytics/tls/analytics.crt', 'AWS_DEFAULT_REGION': 'us-east-1', 'ANALYTICS_BACKUP_BUCKET': '${bucket}'}
hashes = []
for role in ('INGEST', 'QUERY', 'MAINTENANCE'):
    password = secrets.token_urlsafe(36)
    values[f'ANALYTICS_CH_{role}_USER'] = 'analytics_' + role.lower()
    values[f'ANALYTICS_CH_{role}_PASSWORD'] = password
    hashes.append(f'ANALYTICS_CH_{role}_PASSWORD_SHA256=' + hashlib.sha256(password.encode()).hexdigest())
Path('/etc/lw-analytics/client.json').write_text(json.dumps(values))
Path('/etc/lw-analytics/clickhouse.env').write_text('\n'.join(hashes) + '\n')
PY
cat > /etc/systemd/system/lw-pilot-clickhouse.service <<'UNIT'
[Unit]
Description=Pilot ClickHouse
Requires=docker.service
After=docker.service
RequiresMountsFor=/srv/analytics
[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/lw-analytics/deploy
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStopSec=330
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now lw-pilot-clickhouse.service
systemctl disable --now ssh.socket ssh.service
printf 'bootstrap complete\n' > /var/lib/lw-pilot-ready
