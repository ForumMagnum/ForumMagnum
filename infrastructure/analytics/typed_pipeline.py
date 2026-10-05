"""Bounded grouped replay with pooled HTTP and whole-block identity checks."""

import json
import time

from archive import SCHEMA_VERSION, MAX_BATCH_BYTES, MAX_ROWS, decode_batch, get_object, inventory, json_bytes
from clickhouse import ch, clickhouse_session
from extraction import EXTRACTOR_FINGERPRINT, extract
from typed_schema import RAW_TABLE, RECEIPTS_TABLE, schema_sql


def initialize_typed(config):
    for statement in schema_sql().split(';'):
        if statement.strip():
            ch(config, statement)


def external_strings(name, column, values):
    return (name, column + ' String',
            b''.join(json_bytes({column: value}) + b'\n' for value in values))


def receipts(config, keys):
    rows = ch(config, f'''SELECT object_key, checksum, row_count, extractor_fingerprint
        FROM {RECEIPTS_TABLE} FINAL WHERE object_key IN (SELECT object_key FROM wanted)
        FORMAT JSONEachRow''', external=external_strings('wanted', 'object_key', keys))
    return {row['object_key']: row for row in map(json.loads, rows.splitlines())}


def receipt_typed(config, key):
    return receipts(config, [key]).get(key)


def validate_destination(config, events):
    expected = {}
    for event in events:
        identity = (event['content_hash'], event['properties_hash'], event['extractor_fingerprint'])
        if event['event_id'] in expected and expected[event['event_id']] != identity:
            raise ValueError('Conflicting canonical identity within archive')
        expected[event['event_id']] = identity
    rows = ch(config, f'''SELECT event_id, content_hash, properties_hash, extractor_fingerprint
        FROM {RAW_TABLE} FINAL WHERE event_id IN (SELECT event_id FROM wanted)
        FORMAT JSONEachRow''', external=external_strings('wanted', 'event_id', expected))
    existing = {}
    for row in map(json.loads, rows.splitlines()):
        identity = (row['content_hash'], row['properties_hash'], row['extractor_fingerprint'])
        if expected[row['event_id']] != identity:
            raise ValueError('Conflicting canonical identity or extractor at destination')
        existing[row['event_id']] = identity
    return existing == expected


def read_manifest(store, key):
    manifest = json.loads(get_object(store, key))
    validate_manifest(key, manifest)
    return manifest


def validate_manifest(key, manifest):
    if (manifest.get('schema_version') != SCHEMA_VERSION
            or type(manifest['row_count']) is not int or not 0 < manifest['row_count'] <= MAX_ROWS
            or type(manifest['uncompressed_bytes']) is not int
            or not 0 < manifest['uncompressed_bytes'] <= MAX_BATCH_BYTES):
        raise ValueError('Invalid manifest version or bounds')
    if key != f"archive/v1/manifests/{manifest['sha256']}.json":
        raise ValueError('Noncanonical manifest key')


def load_group(store, config, manifests, failpoint=None):
    for key, manifest in manifests.items():
        validate_manifest(key, manifest)
    if (not manifests or sum(m['row_count'] for m in manifests.values()) > MAX_ROWS
            or sum(m['uncompressed_bytes'] for m in manifests.values()) > MAX_BATCH_BYTES):
        raise ValueError('Replay group exceeds archive bounds')
    previous = receipts(config, manifests)
    pending = {}
    for key, manifest in manifests.items():
        applied = previous.get(key)
        if applied:
            if (applied['checksum'] != manifest['sha256']
                    or int(applied['row_count']) != manifest['row_count']
                    or applied['extractor_fingerprint'] != EXTRACTOR_FINGERPRINT):
                raise ValueError('Applied receipt conflicts with archive/extractor; use a new schema version')
        else:
            pending[key] = manifest
    if not pending:
        return 0
    events = []
    for manifest in pending.values():
        events.extend(decode_batch(manifest, get_object(store, manifest['object_key']), prepare=extract))
    # All batches validate before insertion; keep the same single-writer lock as
    # the legacy loader. No ack/receipt can precede the post-insert comparison.
    complete = validate_destination(config, events)
    if not complete:
        ch(config, f'INSERT INTO {RAW_TABLE} FORMAT JSONEachRow',
           data=b''.join(json_bytes(event) + b'\n' for event in events))
    if failpoint == 'after_insert':
        raise RuntimeError('Injected crash: after_insert')
    if not validate_destination(config, events):
        raise RuntimeError('Destination reconciliation failed; queue retained')
    ch(config, f'INSERT INTO {RECEIPTS_TABLE} FORMAT JSONEachRow', data=b''.join(json_bytes({
        'object_key': key, 'checksum': manifest['sha256'], 'row_count': manifest['row_count'],
        'extractor_fingerprint': EXTRACTOR_FINGERPRINT}) + b'\n' for key, manifest in pending.items()))
    if failpoint == 'after_receipt':
        raise RuntimeError('Injected crash: after_receipt')
    return len(events)


def load_typed_batch(store, config, key, failpoint=None):
    manifest = read_manifest(store, key)
    with clickhouse_session(config) as session:
        load_group(store, session, {key: manifest}, failpoint)
    return manifest


def replay_typed(store, config, progress=None):
    manifests = {}
    rows = size = count = imported = groups = 0
    started = time.monotonic()
    with clickhouse_session(config) as session:
        for key in inventory(store):
            manifest = read_manifest(store, key)
            if manifests and (rows + manifest['row_count'] > MAX_ROWS
                              or size + manifest['uncompressed_bytes'] > MAX_BATCH_BYTES):
                imported += load_group(store, session, manifests)
                count += len(manifests)
                groups += 1
                if progress:
                    progress({'manifests_reconciled': count, 'events_processed': imported,
                              'seconds': time.monotonic() - started})
                manifests = {}
                rows = size = 0
            manifests[key] = manifest
            rows += manifest['row_count']
            size += manifest['uncompressed_bytes']
        if manifests:
            imported += load_group(store, session, manifests)
            count += len(manifests)
            groups += 1
    return {'manifests_reconciled': count, 'events_processed': imported,
            'groups': groups, 'seconds': time.monotonic() - started}
