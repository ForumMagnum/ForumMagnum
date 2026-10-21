"""Run only on the named disposable EC2 pilot; outputs aggregate evidence only."""
import argparse
import json
import os
import resource
import subprocess
import sys
import time
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path
from uuid import uuid4

import boto3
import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from archive import decode_batch, get_object, inventory
from operations import backup, restore
from pipeline import ch, clickhouse_config, initialize, load_batch, replay

BUCKET = 'lw-analytics-pilot-083919364732-20261001'
INSTANCE = 'i-00e00a3afa7877dc6'
QUERY_ENVIRONMENT = 'lesswrong.com'


def identity_guard():
    with httpx.Client(trust_env=False) as client:
        token = client.put('http://169.254.169.254/latest/api/token',
                           headers={'X-aws-ec2-metadata-token-ttl-seconds': '60'}).raise_for_status().text
        instance = client.get('http://169.254.169.254/latest/meta-data/instance-id',
                              headers={'X-aws-ec2-metadata-token': token}).raise_for_status().text
    if instance != INSTANCE:
        raise ValueError('This verification is restricted to the isolated pilot instance')
    values = json.loads(Path('/etc/lw-analytics/client.json').read_text())
    if values['ANALYTICS_BACKUP_BUCKET'] != BUCKET:
        raise ValueError('Unexpected backup destination')
    os.environ.update(values)


def scalar(payload, key):
    value = payload.get(key) if isinstance(payload, dict) else None
    if value is None or isinstance(value, str):
        return value
    raise ValueError('Sample includes non-string identity/device fields; reconcile semantics explicitly')


def expected_results(store, keys):
    traffic = defaultdict(lambda: [0, set(), set()])
    breakdown = defaultdict(lambda: [0, set()])
    days = defaultdict(set)
    environments = Counter()
    logical = {}
    for key in keys:
        manifest = json.loads(get_object(store, key))
        for event in decode_batch(manifest, get_object(store, manifest['object_key'])):
            identity = event['event_id']
            if identity in logical:
                if logical[identity] != event['content_hash']:
                    raise ValueError('Conflicting source identities')
                continue
            logical[identity] = event['content_hash']
            environment = event['environment']
            environments[environment] += 1
            if environment != QUERY_ENVIRONMENT:
                continue
            payload = json.loads(event['event_json'])
            day = event['event_time'][:10]
            user, client, device = [scalar(payload, k) for k in ('userId', 'clientId', 'deviceType')]
            t = traffic[day]
            t[0] += 1
            if user is not None:
                t[1].add(user)
                days[user].add(day)
            if client is not None:
                t[2].add(client)
            b = breakdown[(event['event_type'], device)]
            b[0] += 1
            if user is not None:
                b[1].add(user)
    retention = Counter()
    for active in days.values():
        cohort = min(active)
        for day in active:
            retention[(cohort, (date.fromisoformat(day) - date.fromisoformat(cohort)).days)] += 1
    return {'traffic': {d: (v[0], len(v[1]), len(v[2])) for d, v in traffic.items()},
            'breakdown': {k: (v[0], len(v[1])) for k, v in breakdown.items()},
            'retention': dict(retention)}, len(logical), dict(environments)


def fingerprint(config):
    return json.loads(ch(config, '''SELECT count() AS rows,
        groupBitXor(cityHash64(event_id, content_hash)) AS fingerprint
        FROM analytics.events FORMAT JSONEachRow'''))


def compare_queries(query_config, expected):
    metrics = {}
    for name in ('traffic', 'breakdown', 'retention'):
        sql = (Path(__file__).resolve().parents[1] / 'queries' / f'{name}.sql').read_text().rstrip().rstrip(';')
        query_id = str(uuid4())
        start = time.monotonic()
        result = json.loads(ch(query_config, sql + ' FORMAT JSON',
                              {'environment': QUERY_ENVIRONMENT, 'start': '2020-01-01 00:00:00', 'end': '2027-01-01 00:00:00'},
                              query_id=query_id))
        elapsed = time.monotonic() - start
        if name == 'traffic':
            actual = {r['day']: (int(r['events']), int(r['users']), int(r['clients'])) for r in result['data']}
        elif name == 'breakdown':
            actual = {(r['event_type'], r['device_type']): (int(r['events']), int(r['users'])) for r in result['data']}
        else:
            actual = {(r['cohort'], int(r['days_since_first_observed'])): int(r['users']) for r in result['data']}
        if actual != expected[name]:
            raise ValueError(f'{name} differs from independent Python calculation')
        metrics[name] = {'wall_seconds': elapsed, 'statistics': result.get('statistics'),
                         'result_rows': len(actual), 'matched': True}
    return metrics


def main(allow_restore, resume, skip_backups, queries_only):
    if allow_restore and skip_backups:
        raise ValueError('Restore requires completed backups')
    identity_guard()
    store = {'client': boto3.client('s3'), 'bucket': BUCKET}
    ingest = clickhouse_config()
    maintenance = clickhouse_config('maintenance')
    query = clickhouse_config('query')
    keys = list(inventory(store))
    if not keys:
        raise ValueError('Sample archive is empty')
    expected, count, environments = expected_results(store, keys)
    if not environments.get(QUERY_ENVIRONMENT):
        raise ValueError('The queried environment must be represented in the source sample')
    print(json.dumps({'phase': 'source_reconciled', 'rows': count}), flush=True)
    result = {'sample_rows': count, 'archive_manifests': len(keys), 'environments': environments}
    result['query_environment'] = QUERY_ENVIRONMENT
    if queries_only:
        path = Path('/srv/analytics/verification.json')
        result.update(json.loads(path.read_text()))
        assert int(fingerprint(maintenance)['rows']) == count
        result['query_environment'] = QUERY_ENVIRONMENT
        result['queries'] = compare_queries(query, expected)
        path.write_text(json.dumps(result, indent=2))
        store['client'].put_object(Bucket=BUCKET, Key='evidence/verification.json',
                                   Body=json.dumps(result, indent=2).encode(), ServerSideEncryption='AES256')
        print(json.dumps(result, indent=2))
        return
    initialize(maintenance)
    if int(ch(query, 'SELECT count() FROM analytics.events')) and not resume:
        raise ValueError('Initial import requires an empty pilot database')
    started = time.monotonic()
    middle = len(keys) // 2
    for key in keys[:middle]:
        load_batch(store, ingest, key)
    result['first_import_seconds'] = time.monotonic() - started
    print(json.dumps({'phase': 'first_half_loaded', 'seconds': result['first_import_seconds']}), flush=True)
    stamp = str(int(time.time()))
    full = f'pilot-{stamp}-full'
    if not skip_backups:
        ch(maintenance, 'CREATE TABLE IF NOT EXISTS analytics.recovery_probe (k UInt64) ENGINE=MergeTree ORDER BY k')
        ch(maintenance, 'TRUNCATE TABLE analytics.recovery_probe')
        ch(maintenance, 'INSERT INTO analytics.recovery_probe VALUES (1)')
        start = time.monotonic()
        backup(store, maintenance, full)
        result['full_backup_seconds'] = time.monotonic() - start
        print(json.dumps({'phase': 'full_backup_complete'}), flush=True)
        ch(maintenance, 'INSERT INTO analytics.recovery_probe VALUES (2)')
    for key in keys[middle:]:
        load_batch(store, ingest, key)
    result['import_seconds_including_full_backup'] = time.monotonic() - started
    original = fingerprint(maintenance)
    assert int(original['rows']) == count
    result['fingerprint'] = original
    result['queries'] = compare_queries(query, expected)
    print(json.dumps({'phase': 'all_queries_matched', 'rows': count}), flush=True)
    start = time.monotonic()
    replay(store, ingest)
    result['repeat_seconds'] = time.monotonic() - start
    assert fingerprint(maintenance) == original
    result['repeat_matched'] = True
    inc = f'pilot-{stamp}-increment'
    if not skip_backups:
        start = time.monotonic()
        backup(store, maintenance, inc, full)
        result['incremental_backup_seconds'] = time.monotonic() - start
        result['backup_names'] = [full, inc]
        print(json.dumps({'phase': 'incremental_backup_complete'}), flush=True)
    else:
        result['backup_status'] = 'Not tested: temporary S3 lock-file permission awaits approval'
    Path('/srv/analytics/pre-restore.json').write_text(json.dumps(result, indent=2))
    if allow_restore:
        # Only this EC2 pilot, with both completed S3 backup manifests verified.
        ch(maintenance, 'DROP DATABASE analytics SYNC')
        start = time.monotonic()
        restore(store, maintenance, inc)
        result['restore_seconds'] = time.monotonic() - start
        assert fingerprint(maintenance) == original
        assert ch(maintenance, 'SELECT groupArray(k) FROM analytics.recovery_probe').strip() in ('[1,2]', '[2,1]')
        start = time.monotonic()
        replay(store, ingest)
        result['post_restore_replay_seconds'] = time.monotonic() - start
        assert fingerprint(maintenance) == original
        result['restore_and_replay_matched'] = True
        print(json.dumps({'phase': 'restored_and_reconciled', 'rows': count}), flush=True)
    allocation = subprocess.run(['du', '-s', '-B1', '/srv/analytics/clickhouse'],
                                text=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=False)
    result['clickhouse_directory_allocated_bytes'] = int(allocation.stdout.split()[0]) if allocation.returncode == 0 else None
    result['storage_scope'] = 'Entire ClickHouse directory including indexes, metadata, and system logs; not per-table compressed payload size.'
    container = subprocess.check_output(['docker', 'compose', '-f', '/opt/lw-analytics/deploy/compose.yaml',
                                         'ps', '-q', 'clickhouse'], text=True).strip()
    pid = subprocess.check_output(['docker', 'inspect', '-f', '{{.State.Pid}}', container], text=True).strip()
    group = Path(f'/proc/{pid}/cgroup').read_text().strip().split('::', 1)[1]
    result['clickhouse_container_peak_bytes'] = int((Path('/sys/fs/cgroup') / group.lstrip('/') / 'memory.peak').read_text())
    result['importer_peak_rss_bytes'] = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024
    result['memory_scope'] = 'Container peak includes background work and file cache since boot; importer RSS includes independent verification. Neither is per-query memory.'
    Path('/srv/analytics/verification.json').write_text(json.dumps(result, indent=2))
    store['client'].put_object(Bucket=BUCKET, Key='evidence/verification.json',
                               Body=json.dumps(result, indent=2).encode(), ServerSideEncryption='AES256')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--allow-pilot-restore', action='store_true')
    parser.add_argument('--resume', action='store_true', help='Resume this exact pilot archive after an interrupted verification')
    parser.add_argument('--skip-backups', action='store_true', help='Complete unaffected import/query checks only')
    parser.add_argument('--queries-only', action='store_true', help='Reconcile queries against the completed sample import')
    arguments = parser.parse_args()
    main(arguments.allow_pilot_restore, arguments.resume, arguments.skip_backups, arguments.queries_only)
