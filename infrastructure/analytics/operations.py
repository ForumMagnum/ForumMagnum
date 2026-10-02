import json
import os
import re
from datetime import datetime, timezone

from archive import get_object, json_bytes, put_immutable
from pipeline import ch


def backup_url(name):
    if not re.fullmatch(r'[A-Za-z0-9_-]+', name):
        raise ValueError('Invalid backup name')
    bucket = os.environ['ANALYTICS_BACKUP_BUCKET']
    if not re.fullmatch(r'[a-z0-9][a-z0-9.-]+[a-z0-9]', bucket):
        raise ValueError('Invalid backup bucket')
    return f'https://{bucket}.s3.amazonaws.com/clickhouse/{name}/'


def backup(store, config, name, base=None):
    # Caller holds worker_lock for the entire operation. Every table and receipt
    # has the same ingestion boundary, including during incremental backups.
    url = backup_url(name)
    sql = f"BACKUP DATABASE analytics TO S3('{url}')"
    if base:
        # Validate recorded base completion, not just an operator-supplied URL.
        json.loads(get_object(store, f'backups/{base}.json'))
        sql += f" SETTINGS base_backup = S3('{backup_url(base)}')"
    result = ch(config, sql + ' FORMAT JSONEachRow', timeout=None)
    rows = [json.loads(line) for line in result.splitlines()]
    if not rows or rows[0].get('status') != 'BACKUP_CREATED':
        raise RuntimeError('Backup did not complete')
    manifest = {'name': name, 'base': base, 'completed_at': datetime.now(timezone.utc).isoformat(),
                'url': url, 'schema_version': 1, 'database': 'analytics'}
    put_immutable(store, f'backups/{name}.json', json_bytes(manifest))
    return manifest


def restore(store, config, name):
    manifest = json.loads(get_object(store, f'backups/{name}.json'))
    if manifest['url'] != backup_url(name):
        raise ValueError('Backup manifest destination mismatch')
    existing = int(ch(config, "SELECT count() FROM system.tables WHERE database = 'analytics'"))
    if existing:
        raise ValueError('Restore requires an empty destination; never drops existing data')
    result = ch(config, f"RESTORE DATABASE analytics FROM S3('{backup_url(name)}') FORMAT JSONEachRow", timeout=None)
    rows = [json.loads(line) for line in result.splitlines()]
    if not rows or rows[0].get('status') != 'RESTORED':
        raise RuntimeError('Restore did not complete')
    # A crash during backup can leave table snapshots at slightly different
    # instants. Reconcile every archive object after restore; never trust a receipt
    # captured ahead of its data table. Raw duplicates remain logically invisible.
    ch(config, 'TRUNCATE TABLE analytics.applied_batches')
    return {'restored': name, 'next': 'replay archive, then drain pending source queue'}
