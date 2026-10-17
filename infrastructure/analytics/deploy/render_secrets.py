"""Run as root at bootstrap; never prints secret values."""

import hashlib
import json
import os
import sys
from pathlib import Path

FIELDS = ('ANALYTICS_SOURCE_DSN', 'ANALYTICS_CLICKHOUSE_URL', 'ANALYTICS_GATEWAY_TOKEN',
          'ANALYTICS_CH_INGEST_USER', 'ANALYTICS_CH_INGEST_PASSWORD',
          'ANALYTICS_CH_QUERY_USER', 'ANALYTICS_CH_QUERY_PASSWORD',
          'ANALYTICS_CH_MAINTENANCE_USER', 'ANALYTICS_CH_MAINTENANCE_PASSWORD')


def render(source, directory):
    os.umask(0o077)
    values = json.loads(source.read_text())
    lines = []
    for field in FIELDS:
        value = values[field]
        if not isinstance(value, str) or '\n' in value or '\r' in value:
            raise ValueError('Secret fields must be single-line strings')
        lines.append(field + '=' + json.dumps(value))
    (directory / 'worker.env').write_text('\n'.join(lines) + '\n')
    hashes = []
    for role in ('INGEST', 'QUERY', 'MAINTENANCE'):
        key = f'ANALYTICS_CH_{role}_PASSWORD'
        if len(values[key]) < 32:
            raise ValueError('Database passwords must have at least 32 characters')
        hashes.append(key + '_SHA256=' + hashlib.sha256(values[key].encode()).hexdigest())
    (directory / 'clickhouse.env').write_text('\n'.join(hashes) + '\n')
    tls = directory / 'tls'
    tls.mkdir(exist_ok=True)
    (tls / 'analytics.crt').write_text(values['tls_certificate'])
    (tls / 'analytics.key').write_text(values['tls_private_key'])


if __name__ == '__main__':
    source = Path(sys.argv[1])
    render(source, source.parent)
