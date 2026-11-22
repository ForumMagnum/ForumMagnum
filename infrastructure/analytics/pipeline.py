"""RDS adapter and independent archive loader; acknowledgements are exact IDs."""

import fcntl
import json
import os
import time
from contextlib import contextmanager
from pathlib import Path
from uuid import uuid4

import psycopg

from archive import (MAX_BATCH_BYTES, MAX_ROWS, MAX_ROW_BYTES, decode_batch, envelope,
                     get_object, inventory, json_bytes, publish, put_immutable)

from clickhouse import ch, clickhouse_config as clickhouse_config
from typed_pipeline import initialize_typed, load_typed_batch, receipt_typed, replay_typed
from typed_schema import EVENTS_VIEW

SQL_DIR = Path(__file__).parent / 'sql'
SOURCE_COLUMNS = '''r.id::text, r.environment, r.event_type, r.timestamp,
    CASE WHEN octet_length(r.event::text) <= %s THEN r.event::text END'''
LEASE_KEY = 72913440219301


def source_connection():
    connection = psycopg.connect(os.environ['ANALYTICS_SOURCE_DSN'], autocommit=True,
                                connect_timeout=10, application_name='lw-analytics-export',
                                options='-c statement_timeout=30000 -c lock_timeout=2000 -c timezone=UTC')
    if os.environ.get('ANALYTICS_TEST_MODE') != '1' and (
            not connection.pgconn.ssl_in_use or connection.info.get_parameters().get('sslmode') != 'verify-full'):
        connection.close()
        raise ValueError('Source requires TLS with sslmode=verify-full')
    return connection


@contextmanager
def source_lease(connection):
    if not connection.execute('SELECT pg_try_advisory_lock(%s)', (LEASE_KEY,)).fetchone()[0]:
        raise RuntimeError('Another exporter owns the source lease')
    try:
        yield
    finally:
        if not connection.closed:
            connection.execute('SELECT pg_advisory_unlock(%s)', (LEASE_KEY,))


@contextmanager
def worker_lock():
    path = Path(os.environ.get('ANALYTICS_STATE_DIR', '/var/lib/lw-analytics'))
    path.mkdir(parents=True, exist_ok=True)
    with (path / 'worker.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield


def read_pending(connection, limit=10000):
    if not 1 <= limit <= MAX_ROWS:
        raise ValueError('Invalid batch size')
    # Two bounded indexed reads. No row locks/transaction span remote delivery.
    queued = connection.execute('''SELECT raw_id, received_at FROM analytics_export.pending
                                    ORDER BY raw_id LIMIT %s''', (limit,)).fetchall()
    if not queued:
        return []
    ids = [row[0] for row in queued]
    received = dict(queued)
    events = []
    size = 0
    # A client-side cursor buffers the entire result before fetchone/fetchmany.
    # A server cursor bounds that buffer to 16 payloads (at most 64 MiB).
    with connection.transaction(), connection.cursor(name='analytics_pending') as cursor:
        cursor.itersize = 16
        cursor.execute(f'''SELECT {SOURCE_COLUMNS} FROM public.raw r
                            WHERE r.id = ANY(%s) ORDER BY r.id''', (MAX_ROW_BYTES, ids))
        for row in cursor:
            event = envelope((*row, received[int(row[0])]))
            size += len(json_bytes(event)) + 1
            if size > MAX_BATCH_BYTES:
                break
            events.append(event)
        else:
            if len(events) != len(queued):
                raise RuntimeError('Pending source rows disappeared; append-only contract violated')
    if not events:
        raise ValueError('No row fits archive limits; queue retained')
    return events


def typed_mode(config):
    mode = config.get('event_schema', 'legacy')
    if mode not in ('legacy', 'typed-v1'):
        raise ValueError('Unknown event schema')
    return mode == 'typed-v1'


def events_view(config):
    return EVENTS_VIEW if typed_mode(config) else 'analytics.events'


def initialize(config):
    if typed_mode(config):
        initialize_typed(config)
        return
    sql = '\n'.join(line.split('--')[0] for line in (SQL_DIR / 'clickhouse.sql').read_text().splitlines())
    for statement in sql.split(';'):
        if statement.strip():
            ch(config, statement)


def receipt(config, key):
    if typed_mode(config):
        return receipt_typed(config, key)
    rows = ch(config, '''SELECT checksum, row_count FROM analytics.applied_batches FINAL
                        WHERE object_key = {key:String} FORMAT JSONEachRow''', {'key': key})
    return json.loads(rows) if rows.strip() else None


def validate_destination(config, events):
    # Sorting and partitioning depend only on canonical identity. Lookups use the
    # primary index; replay cannot split logical identity across monthly partitions.
    existing = {}
    for offset in range(0, len(events), 500):
        ids = '[' + ','.join("'" + event['event_id'].replace('\\', '\\\\').replace("'", "\\'") + "'"
                             for event in events[offset:offset + 500]) + ']'
        rows = ch(config, '''SELECT event_id, content_hash FROM analytics.raw_events FINAL
                            WHERE event_id IN {ids:Array(String)} FORMAT JSONEachRow''', {'ids': ids})
        existing.update({row['event_id']: row['content_hash'] for row in map(json.loads, rows.splitlines())})
    expected = {}
    for event in events:
        event_id = event['event_id']
        if event_id in expected and expected[event_id] != event['content_hash']:
            raise ValueError('Conflicting canonical identity within archive')
        expected[event_id] = event['content_hash']
        if event_id in existing and existing[event_id] != event['content_hash']:
            raise ValueError('Conflicting canonical identity at destination')
    return expected == existing


def load_batch(store, config, key, failpoint=None):
    if typed_mode(config):
        return load_typed_batch(store, config, key, failpoint)
    manifest = json.loads(get_object(store, key))
    if key != f"archive/v1/manifests/{manifest['sha256']}.json":
        raise ValueError('Noncanonical manifest key')
    previous = receipt(config, key)
    if previous:
        if previous['checksum'] != manifest['sha256'] or int(previous['row_count']) != manifest['row_count']:
            raise ValueError('Applied receipt conflicts with archive')
        return manifest
    events = decode_batch(manifest, get_object(store, manifest['object_key']))
    validate_destination(config, events)
    ch(config, 'INSERT INTO analytics.raw_events FORMAT JSONEachRow',
       data=b''.join(json_bytes(event) + b'\n' for event in events))
    checkpoint(failpoint, 'after_insert')
    if not validate_destination(config, events):
        raise RuntimeError('Destination reconciliation failed; queue retained')
    ch(config, 'INSERT INTO analytics.applied_batches FORMAT JSONEachRow', data=json_bytes({
        'object_key': key, 'checksum': manifest['sha256'], 'row_count': manifest['row_count']}))
    checkpoint(failpoint, 'after_receipt')
    return manifest


def checkpoint(failpoint, name):
    if failpoint == name:
        raise RuntimeError(f'Injected crash: {name}')


def acknowledge(connection, config, key, manifest):
    applied = receipt(config, key)
    if not applied or applied['checksum'] != manifest['sha256']:
        raise RuntimeError('No durable applied receipt; refusing acknowledgement')
    # Session advisory lease remains held on this exact connection. A lost
    # connection fails closed instead of reconnecting and acknowledging work.
    ids = [int(value) for value in manifest['source_ids'] if value is not None]
    connection.execute('DELETE FROM analytics_export.pending WHERE raw_id = ANY(%s)', (ids,))


def cycle(connection, store, config, max_batches=100, failpoint=None):
    started = time.monotonic()
    count = 0
    with source_lease(connection):
        for _ in range(max_batches):
            events = read_pending(connection)
            if not events:
                return {'complete': True, 'batches': count, 'seconds': time.monotonic() - started}
            key, manifest = publish(store, events)
            checkpoint(failpoint, 'after_archive')
            load_batch(store, config, key, failpoint)
            checkpoint(failpoint, 'before_ack')
            acknowledge(connection, config, key, manifest)
            checkpoint(failpoint, 'after_ack')
            count += 1
    # Exhausting a time/batch budget is not evidence of a completed daily cycle.
    return {'complete': False, 'batches': count, 'seconds': time.monotonic() - started}


def replay(store, config):
    if typed_mode(config):
        return replay_typed(store, config)
    count = 0
    for key in inventory(store):
        load_batch(store, config, key)
        count += 1
    return {'manifests_reconciled': count}


def export_snapshot(connection, store, snapshot_name, resume_after=None, max_batches=None):
    """Use a frozen clone for crash-resumable exports; live snapshots restart at 0.

    A snapshot identifier from pg_export_snapshot is deliberately NOT treated as
    durable. The runbook requires an immutable clone for persisted keyset resume.
    """
    if not snapshot_name or any(c not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_' for c in snapshot_name):
        raise ValueError('Use an explicit snapshot/clone identifier')
    if resume_after is not None and os.environ.get('ANALYTICS_FROZEN_SOURCE') != snapshot_name:
        raise ValueError('Resume requires the same frozen source identity')
    if resume_after is not None:
        previous = json.loads(get_object(store, f'coverage/{snapshot_name}/chunks/{resume_after}.json'))
        if previous['last_id'] != str(resume_after):
            raise ValueError('Resume cursor lacks a matching durable chunk checkpoint')
    count = 0
    last = resume_after
    keys = []
    with connection.transaction():
        connection.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
        capture = connection.execute('''SELECT count(*) FROM pg_trigger
            WHERE tgrelid = 'public.raw'::regclass AND tgname = 'analytics_archive_capture'
              AND tgenabled IN ('O', 'A')''').fetchone()[0]
        if not capture:
            raise ValueError('Install capture before establishing the export snapshot/clone')
        # Snapshot is established here, after capture was installed on the primary.
        snapshot = connection.execute('SELECT pg_current_snapshot()::text').fetchone()[0]
        while max_batches is None or count < max_batches:
            # Keyset is safe only inside this one consistent snapshot or frozen clone.
            events = []
            size = 0
            with connection.cursor(name='analytics_snapshot') as cursor:
                cursor.itersize = 16
                cursor.execute(f'''SELECT {SOURCE_COLUMNS} FROM public.raw r
                    WHERE (%s::bigint IS NULL OR r.id > %s) ORDER BY r.id LIMIT %s''',
                    (MAX_ROW_BYTES, last, last, 10000))
                for row in cursor:
                    event = envelope((*row, None))
                    size += len(json_bytes(event)) + 1
                    if size > MAX_BATCH_BYTES:
                        if not events:
                            raise ValueError('No row fits archive limits')
                        break
                    events.append(event)
            if not events:
                completion = {'snapshot': snapshot, 'source': snapshot_name, 'resume_after': resume_after,
                              'last_id': last, 'manifest_keys': keys, 'complete_segment': True}
                put_immutable(store, f'coverage/{snapshot_name}/{uuid4()}.json', json_bytes(completion))
                return completion
            key, manifest = publish(store, events)
            keys.append(key)
            previous_cursor = last
            last = events[-1]['source_id']
            put_immutable(store, f'coverage/{snapshot_name}/chunks/{last}.json', json_bytes({
                'source': snapshot_name, 'previous_cursor': previous_cursor, 'last_id': last,
                'manifest': key, 'row_count': manifest['row_count'], 'sha256': manifest['sha256']}))
            count += 1
            # Structured progress contains no event payload and can be persisted.
            print(json.dumps({'source': snapshot_name, 'last_id': last, 'manifest': key}), flush=True)
    return {'source': snapshot_name, 'last_id': last, 'complete_segment': False, 'manifest_keys': keys}
