#!/bin/bash
set -euo pipefail
umask 077
export DEBIAN_FRONTEND=noninteractive AWS_DEFAULT_REGION=us-east-1
# Outbound security-group rules permit HTTPS only.
sed -i 's|http://|https://|g' /etc/apt/sources.list.d/ubuntu.sources
apt-get update
apt-get install -y docker.io docker-compose-v2 python3-venv python3-boto3 nvme-cli acl
systemctl enable --now docker
id analytics >/dev/null 2>&1 || useradd --system --home /opt/lw-analytics analytics
install -d -m 0755 -o root -g root /opt/lw-analytics
install -d -m 0750 -o root -g analytics /etc/lw-analytics
# Use a publicly trusted certificate for this DNS name on both TLS listeners.
# Only this host resolves it to loopback; client private DNS resolves the EC2 IP.
echo '127.0.0.1 ${gateway_hostname}' >> /etc/hosts

# The separately retained volume is attached after instance creation. Match its
# exact AWS serial; never format an arbitrary device or fall back to root disk.
volume_serial=$(echo '${volume_id}' | tr -d '-')
device=''
for attempt in $(seq 1 120); do
  device=$(lsblk -dn -o NAME,SERIAL | awk -v serial="$volume_serial" '$2 == serial {print "/dev/" $1}')
  test -n "$device" && break
  sleep 5
done
test -b "$device"
if ! blkid "$device" >/dev/null 2>&1; then
  # A missing signature may mean damaged retained data, not a new empty volume.
  # The operator initializes a verified new volume, then reruns cloud-init.
  echo 'Data volume has no readable filesystem; explicit initialization or recovery required.' >&2
  exit 1
fi
test "$(blkid -s TYPE -o value "$device")" = ext4
install -d /srv/analytics
uuid=$(blkid -s UUID -o value "$device")
echo "UUID=$uuid /srv/analytics ext4 defaults 0 2" >> /etc/fstab
mount /srv/analytics
install -d -o analytics -g analytics -m 0750 /srv/analytics/state
install -d -o 101 -g 101 -m 0750 /srv/analytics/clickhouse

python3 - <<'PYDOWNLOAD'
from urllib.parse import urlparse
import boto3
artifact = urlparse('${artifact_uri}')
assert artifact.scheme == 's3' and artifact.netloc
boto3.client('s3').download_file(artifact.netloc, artifact.path.lstrip('/'), '/tmp/analytics-release.tar.gz')
PYDOWNLOAD
echo '${artifact_sha256}  /tmp/analytics-release.tar.gz' | sha256sum -c -
tar -xzf /tmp/analytics-release.tar.gz -C /opt/lw-analytics
chown -R root:root /opt/lw-analytics
chmod -R go-w /opt/lw-analytics
python3 -m venv /opt/lw-analytics/.venv
/opt/lw-analytics/.venv/bin/pip install -r /opt/lw-analytics/requirements.lock

/opt/lw-analytics/.venv/bin/python - <<'PYSECRET'
from pathlib import Path
import boto3
value = boto3.client('secretsmanager').get_secret_value(SecretId='${worker_secret_arn}')['SecretString']
Path('/etc/lw-analytics/secret.json').write_text(value)
PYSECRET
chmod 0600 /etc/lw-analytics/secret.json
/opt/lw-analytics/.venv/bin/python /opt/lw-analytics/deploy/render_secrets.py /etc/lw-analytics/secret.json
rm /etc/lw-analytics/secret.json
cat >> /etc/lw-analytics/worker.env <<'EOF'
AWS_DEFAULT_REGION=us-east-1
ANALYTICS_ARCHIVE_BUCKET=${archive_bucket}
ANALYTICS_BACKUP_BUCKET=${backup_bucket}
ANALYTICS_CONTROL_TABLE=${control_table}
EOF
chown root:analytics /etc/lw-analytics/worker.env /etc/lw-analytics/tls/*
chown root:analytics /etc/lw-analytics/tls
chmod 0750 /etc/lw-analytics/tls
chmod 0640 /etc/lw-analytics/worker.env /etc/lw-analytics/tls/*
# The ClickHouse container reads the same TLS files under its uid 101.
setfacl -m u:101:rx /etc/lw-analytics/tls
setfacl -m u:101:r /etc/lw-analytics/tls/*
install -m 0755 /opt/lw-analytics/deploy/lw-analytics-stop /usr/local/sbin/lw-analytics-stop
echo 'analytics ALL=(root) NOPASSWD: /usr/local/sbin/lw-analytics-stop' > /etc/sudoers.d/lw-analytics
chmod 0440 /etc/sudoers.d/lw-analytics
cp /opt/lw-analytics/deploy/lw-analytics.service /etc/systemd/system/
cp /opt/lw-analytics/deploy/lw-clickhouse.service /etc/systemd/system/
cd /opt/lw-analytics/deploy
docker compose up -d
systemctl daemon-reload
systemctl enable lw-clickhouse
# Enable on boot, but do not start before the operator initializes schema,
# installs reviewed source capture, and verifies TLS/roles/networking.
systemctl enable lw-analytics
