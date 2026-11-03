"""Read-only, bounded historical import, supervised independently of an operator.

Each completed time window is a separate PostgreSQL snapshot. An interrupted
window is reread from its beginning; a timestamp or sequence ID is never used as
an across-connection completeness cursor. This is not continuous capture.
"""

import argparse
import json
import os
import re
import shutil
import sys
import time
from datetime import datetime, timedelta, timezone
from functools import partial
from pathlib import Path

import boto3
from botocore.exceptions import ClientError

from archive import (MAX_BATCH_BYTES, MAX_ROW_BYTES, MAX_ROWS, digest, envelope,
                     get_object, json_bytes, publish, put_immutable, store_config)
from clickhouse import clickhouse_config, clickhouse_session
from extraction import EXTRACTOR_FINGERPRINT
from pipeline import SOURCE_COLUMNS, source_connection, worker_lock
from typed_pipeline import load_group, read_manifest

QUERY = f'''SELECT {SOURCE_COLUMNS} FROM public.raw r
    WHERE r.timestamp >= %s AND r.timestamp < %s ORDER BY r.timestamp'''


class ResourceLimit(Exception):
    """A deliberate stop requiring operator review, not automatic retries."""


def timestamp(value):
    result = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if result.tzinfo is None:
        raise ValueError('Backfill boundaries require an explicit timezone')
    return result.astimezone(timezone.utc)


def validate_job(job):
    if not re.fullmatch('[a-zA-Z0-9_-]+', job['name']):
        raise ValueError('Invalid job name')
    start, end, deadline = [timestamp(job[key]) for key in ('start', 'end', 'deadline')]
    now = datetime.now(timezone.utc)
    if not start < end <= now or deadline <= end:
        raise ValueError('Require a fixed historical interval and later deadline')
    if not 1 <= job['window_hours'] <= 24:
        raise ValueError('Windows must be between one hour and one day')
    if not 1 <= job['batch_rows'] <= MAX_ROWS:
        raise ValueError('Invalid batch size')
    if not 0 <= job['minimum_free_bytes'] or not 0 < job['minimum_free_fraction'] < 1:
        raise ValueError('Invalid disk reserve')
    if job['extractor_fingerprint'] != EXTRACTOR_FINGERPRINT:
        raise ValueError('Job extractor differs from installed code')
    if not job['source_identity'] or not job['archive_bucket']:
        raise ValueError('Source and archive identities are required')
    return job


def windows(job):
    # Recent data becomes useful first. Half-open boundaries never overlap.
    start, end = timestamp(job['start']), timestamp(job['end'])
    while end > start:
        lower = max(start, end - timedelta(hours=job['window_hours']))
        yield lower, end
        end = lower


def source_identity(connection):
    return digest(json_bytes({'host': connection.info.host, 'port': connection.info.port,
                              'database': connection.info.dbname}))


def verify_source(connection, job):
    if source_identity(connection) != job['source_identity']:
        raise ValueError('Connected source differs from the fixed job identity')
    if os.environ.get('ANALYTICS_TEST_MODE') != '1':
        select, write = connection.execute("""SELECT
            has_table_privilege(current_user, 'public.raw', 'SELECT'),
            has_table_privilege(current_user, 'public.raw', 'INSERT,UPDATE,DELETE,TRUNCATE')""").fetchone()
        if not select or write:
            raise ValueError('Backfill requires a dedicated SELECT-only source role')


def job_definition(job):
    # Operational limits may be tightened/extended without changing coverage.
    return {key: job[key] for key in ('name', 'start', 'end', 'window_hours',
            'source_identity', 'archive_bucket', 'extractor_fingerprint')}


def job_hash(job):
    return digest(json_bytes(job_definition(job)))


def prefix(job):
    return f"coverage/{job['name']}"


def window_key(job, start):
    return f"{prefix(job)}/windows/{start.strftime('%Y%m%dT%H%M%S%fZ')}.json"


def optional_json(store, key):
    try:
        return json.loads(get_object(store, key))
    except FileNotFoundError:
        return None
    except ClientError as error:
        if error.response['Error']['Code'] not in ('NoSuchKey', '404'):
            raise
        return None


def write_status(store, path, job, status):
    status = {**status, 'job': job['name'], 'updated_at': datetime.now(timezone.utc).isoformat(),
              'start': job['start'], 'end': job['end'], 'extractor_fingerprint': EXTRACTOR_FINGERPRINT}
    data = json_bytes(status)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    with temporary.open('wb') as output:
        output.write(data)
        output.flush()
        os.fsync(output.fileno())
    temporary.replace(path)
    if 'client' in store:
        store['client'].put_object(Bucket=store['bucket'], Key=f"evidence/{job['name']}/status.json",
                                   Body=data, ServerSideEncryption='AES256')
    print(data.decode(), flush=True)


def check_resources(job, disk_path):
    if datetime.now(timezone.utc) >= timestamp(job['deadline']):
        raise ResourceLimit('deadline_reached')
    usage = shutil.disk_usage(disk_path)
    if usage.free < max(job['minimum_free_bytes'], usage.total * job['minimum_free_fraction']):
        raise ResourceLimit('disk_reserve_reached')


def check_index_plan(connection, start, end):
    plan = connection.execute('EXPLAIN (FORMAT JSON) ' + QUERY,
                              (MAX_ROW_BYTES, start.replace(tzinfo=None), end.replace(tzinfo=None))).fetchone()[0]
    nodes = [plan[0]['Plan']]
    indexed = False
    while nodes:
        node = nodes.pop()
        if node['Node Type'] == 'Seq Scan':
            raise ResourceLimit('unbounded_source_scan')
        indexed |= node['Node Type'] in ('Index Scan', 'Index Only Scan', 'Bitmap Index Scan')
        nodes.extend(node.get('Plans', []))
    if not indexed:
        raise ResourceLimit('missing_source_index')


def load_window_receipts(store, config, record):
    rows = 0
    for key in record['manifests']:
        manifest = read_manifest(store, key)
        load_group(store, config, {key: manifest})
        rows += manifest['row_count']
    if rows != record['rows']:
        raise ValueError('Window count differs from durable manifests')


def export_window(connection, store, config, job, start, end, progress, guard, failpoint=None):
    keys, events = [], []
    size = rows = 0
    guard()
    with connection.transaction():
        connection.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
        # Evaluate the plan and establish the snapshot in the same transaction.
        check_index_plan(connection, start, end)
        snapshot, observed_at = connection.execute('SELECT pg_current_snapshot()::text, now()::text').fetchone()
        with connection.cursor(name='historical_window') as cursor:
            # A server cursor bounds driver memory, including unusually large JSON.
            cursor.itersize = 64
            cursor.execute(QUERY, (MAX_ROW_BYTES, start.replace(tzinfo=None), end.replace(tzinfo=None)))
            for row in cursor:
                event = envelope((*row, None))
                length = len(json_bytes(event)) + 1
                if events and (size + length > MAX_BATCH_BYTES or len(events) >= job['batch_rows']):
                    guard()
                    key, manifest = publish(store, events)
                    if failpoint == 'after_archive':
                        raise RuntimeError('Injected crash: after_archive')
                    load_group(store, config, {key: manifest}, failpoint)
                    keys.append(key)
                    rows += len(events)
                    progress(rows, len(keys))
                    events, size = [], 0
                events.append(event)
                size += length
            if events:
                guard()
                key, manifest = publish(store, events)
                if failpoint == 'after_archive':
                    raise RuntimeError('Injected crash: after_archive')
                load_group(store, config, {key: manifest}, failpoint)
                keys.append(key)
                rows += len(events)
                progress(rows, len(keys))
        # Only EOF, followed by all archive and ClickHouse receipts, completes a window.
    record = {'start': start.isoformat(), 'end': end.isoformat(), 'rows': rows, 'manifests': keys,
              'source_snapshot': snapshot, 'observed_at': observed_at, 'source_identity': job['source_identity'],
              'job_sha256': job_hash(job), 'complete': True,
              'coverage': 'rows_visible_in_this_window_snapshot',
              'extractor_fingerprint': EXTRACTOR_FINGERPRINT}
    if failpoint == 'before_window_checkpoint':
        raise RuntimeError('Injected crash: before_window_checkpoint')
    put_immutable(store, window_key(job, start), json_bytes(record))
    return record


def report_progress(store, status_path, job, status, started, rows, batches):
    status.update(window_rows=rows, window_batches=batches, elapsed_seconds=round(time.monotonic() - started, 1))
    write_status(store, status_path, job, status)


def run(connection, store, config, job, state_dir, failpoint=None):
    validate_job(job)
    if config.get('event_schema') != 'typed-v1':
        raise ValueError('Historical worker requires typed-v1')
    if 'bucket' in store and store['bucket'] != job['archive_bucket']:
        raise ValueError('Wrong archive bucket')
    verify_source(connection, job)
    put_immutable(store, f'{prefix(job)}/job.json', json_bytes(job_definition(job)))
    connection.execute('SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY')
    # Limit each FETCH and idle transaction. A window snapshot lives for minutes,
    # not the entire year. Never acquire write/advisory locks on the source.
    connection.execute("SET statement_timeout = '120s'")
    connection.execute("SET idle_in_transaction_session_timeout = '10min'")
    status_path = state_dir / 'status.json'
    completed_rows = completed_windows = 0
    total_windows = sum(1 for _ in windows(job))
    started = time.monotonic()
    status = {'state': 'running', 'completed_rows': 0, 'completed_windows': 0, 'total_windows': total_windows}

    guard = partial(check_resources, job, state_dir)
    progress = partial(report_progress, store, status_path, job, status, started)

    try:
        with clickhouse_session(config) as session:
            for start, end in windows(job):
                guard()
                status.update(window_start=start.isoformat(), window_end=end.isoformat(), window_rows=0, window_batches=0)
                previous = optional_json(store, window_key(job, start))
                if previous:
                    if (previous['job_sha256'] != job_hash(job) or not previous['complete']
                            or previous['start'] != start.isoformat() or previous['end'] != end.isoformat()):
                        raise ValueError('Window checkpoint belongs to a different job')
                    load_window_receipts(store, session, previous)
                    record = previous
                else:
                    record = export_window(connection, store, session, job, start, end, progress, guard, failpoint)
                completed_rows += record['rows']
                completed_windows += 1
                status.update(completed_rows=completed_rows, completed_windows=completed_windows, window_rows=0)
                write_status(store, status_path, job, status)
        status['state'] = 'complete'
        status['coverage'] = 'per_window_snapshots; later/backdated commits require a separate catch-up'
        put_immutable(store, f'{prefix(job)}/complete.json', json_bytes({
            'job_sha256': job_hash(job), 'completed_rows': completed_rows,
            'completed_windows': completed_windows, 'coverage': status['coverage']}))
        write_status(store, status_path, job, status)
        return status
    except Exception as error:
        status.update(state='blocked' if isinstance(error, ResourceLimit) else 'failed',
                      error_type=type(error).__name__)
        if isinstance(error, ResourceLimit):
            status['reason'] = str(error)
        # Database/server exception text may contain payloads or credentials.
        write_status(store, status_path, job, status)
        raise


def main():
    os.umask(0o077)
    parser = argparse.ArgumentParser()
    parser.add_argument('--job', type=Path, required=True)
    parser.add_argument('--client', type=Path, default=Path('/etc/lw-analytics/client.json'))
    parser.add_argument('--state-dir', type=Path, default=Path('/srv/analytics/backfill'))
    args = parser.parse_args()
    job = validate_job(json.loads(args.job.read_text()))
    os.environ.update(json.loads(args.client.read_text()))
    os.environ.update(ANALYTICS_ARCHIVE_BUCKET=job['archive_bucket'], ANALYTICS_EVENT_SCHEMA='typed-v1',
                      ANALYTICS_STATE_DIR='/var/lib/lw-analytics')
    # Instance role credentials refresh automatically; no operator AWS session,
    # SSH tunnel, browser or laptop connection is involved after service start.
    secret = boto3.client('ssm', region_name=job['region']).get_parameter(
        Name=job['source_parameter'], WithDecryption=True)['Parameter']['Value']
    os.environ['ANALYTICS_SOURCE_DSN'] = secret
    with worker_lock(), source_connection() as connection:
        run(connection, store_config(), clickhouse_config(), job, args.state_dir)


if __name__ == '__main__':
    try:
        main()
    except ResourceLimit as error:
        print(json.dumps({'state': 'blocked', 'reason': str(error)}), flush=True)
        sys.exit(78)
    except Exception as error:
        print(json.dumps({'state': 'failed', 'error_type': type(error).__name__}), flush=True)
        sys.exit(1)
