"""Versioned, lossless event archive. No application or production defaults."""

import gzip
import hashlib
import io
import json
import os
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from uuid import UUID

import boto3
from botocore.exceptions import ClientError

SCHEMA_VERSION = 1
MAX_ROW_BYTES = 4 * 1024 * 1024
MAX_BATCH_BYTES = 64 * 1024 * 1024
MAX_ROWS = 50000


def json_bytes(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()


def digest(data):
    return hashlib.sha256(data).hexdigest()


def utc(value):
    if isinstance(value, str):
        value = datetime.fromisoformat(value.replace('Z', '+00:00'))
    # Source is timestamp WITHOUT time zone. The application explicitly writes UTC.
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).strftime('%Y-%m-%d %H:%M:%S.%f')


def envelope(row):
    source_id, environment, event_type, event_time, event_json, received_at = row
    if source_id is None or event_json is None:
        raise ValueError('Missing source identity or oversized payload; queue entry retained')
    if not -(2**63) <= int(source_id) < 2**63:
        raise ValueError('Source ID outside Int64')
    if len(event_json.encode()) > MAX_ROW_BYTES:
        raise ValueError('Oversized payload; queue entry retained')
    # Parse only to validate and find the explicitly reserved future producer ID.
    # Store the original JSON text, never a float-decoded/reserialized payload.
    payload = json.loads(event_json, parse_float=Decimal)
    producer_id = payload.get('_analyticsEventId') if isinstance(payload, dict) else None
    event_id = f'rds:raw:{source_id}'
    if producer_id is not None:
        event_id = f'uuid:{UUID(producer_id)}'
    result = {
        'schema_version': SCHEMA_VERSION, 'event_id': event_id,
        'source_id': str(source_id), 'environment': environment,
        'event_type': event_type, 'event_time': utc(event_time),
        # Historical receipt time is unknown; never substitute event time.
        'received_at': utc(received_at) if received_at else None,
        'event_json': event_json,
    }
    result['content_hash'] = event_hash(result)
    return result


def event_hash(event):
    # Delivery metadata can differ between overlapping historical/live exports.
    return digest(json_bytes({key: event[key] for key in
                              ('event_id', 'environment', 'event_type', 'event_time', 'event_json')}))


def encode_batch(events):
    if not events or len(events) > MAX_ROWS:
        raise ValueError('Batch must contain 1..50000 rows')
    data = b''.join(json_bytes(event) + b'\n' for event in events)
    if len(data) > MAX_BATCH_BYTES:
        raise ValueError('Batch exceeds byte limit; reduce batch size')
    checksum = digest(data)
    key = f'archive/v1/objects/{checksum}.ndjson.gz'
    manifest = {
        'schema_version': SCHEMA_VERSION, 'object_key': key, 'sha256': checksum,
        'row_count': len(events), 'uncompressed_bytes': len(data),
        'event_ids': [event['event_id'] for event in events],
        'source_ids': [event['source_id'] for event in events],
    }
    return f'archive/v1/manifests/{checksum}.json', manifest, gzip.compress(data, mtime=0)


def decode_batch(manifest, compressed):
    if manifest.get('schema_version') != SCHEMA_VERSION:
        raise ValueError('Unsupported archive version')
    if not 0 < manifest['row_count'] <= MAX_ROWS:
        raise ValueError('Invalid row count')
    with gzip.GzipFile(fileobj=io.BytesIO(compressed)) as stream:
        data = stream.read(MAX_BATCH_BYTES + 1)
    if len(data) > MAX_BATCH_BYTES or len(data) != manifest['uncompressed_bytes']:
        raise ValueError('Invalid archive size')
    if digest(data) != manifest['sha256']:
        raise ValueError('Archive checksum mismatch')
    if manifest['object_key'] != f"archive/v1/objects/{manifest['sha256']}.ndjson.gz":
        raise ValueError('Noncanonical object key')
    events = [json.loads(line) for line in data.splitlines()]
    if (len(events) != manifest['row_count'] or
            [event['event_id'] for event in events] != manifest['event_ids'] or
            [event['source_id'] for event in events] != manifest['source_ids']):
        raise ValueError('Manifest identities do not match archive')
    for event in events:
        if event['schema_version'] != SCHEMA_VERSION or event['content_hash'] != event_hash(event):
            raise ValueError('Invalid event version/hash')
        if utc(event['event_time']) != event['event_time']:
            raise ValueError('Noncanonical timestamp')
        json.loads(event['event_json'], parse_float=Decimal)
    return events


def store_config():
    local = os.environ.get('ANALYTICS_LOCAL_ARCHIVE')
    if local:
        if os.environ.get('ANALYTICS_TEST_MODE') != '1':
            raise ValueError('Local archive requires explicit test mode')
        return {'directory': Path(local)}
    return {'client': boto3.client('s3'), 'bucket': os.environ['ANALYTICS_ARCHIVE_BUCKET']}


def safe_key(key):
    if key.startswith('/') or '..' in key.split('/') or not key.startswith(('archive/', 'backups/', 'coverage/')):
        raise ValueError('Invalid archive key')
    return key


def put_immutable(store, key, data):
    safe_key(key)
    if 'directory' in store:
        path = store['directory'] / key
        path.parent.mkdir(parents=True, exist_ok=True)
        # Write + fsync, then atomic hard link: partial local test files are invisible.
        temporary = path.with_suffix('.tmp')
        with temporary.open('wb') as file:
            file.write(data)
            file.flush()
            os.fsync(file.fileno())
        try:
            os.link(temporary, path)
        except FileExistsError:
            if path.read_bytes() != data:
                raise ValueError('Immutable object conflict')
        finally:
            temporary.unlink(missing_ok=True)
        return
    try:
        store['client'].put_object(Bucket=store['bucket'], Key=key, Body=data,
                                   IfNoneMatch='*', ServerSideEncryption='AES256',
                                   Metadata={'sha256': digest(data)})
    except ClientError as error:
        if error.response['Error']['Code'] not in ('PreconditionFailed', '412'):
            raise
        if get_object(store, key) != data:
            raise ValueError('Immutable object conflict') from error


def get_object(store, key):
    safe_key(key)
    if 'directory' in store:
        data = (store['directory'] / key).read_bytes()
    else:
        response = store['client'].get_object(Bucket=store['bucket'], Key=key)
        with response['Body'] as body:
            data = body.read(MAX_BATCH_BYTES + 1024 * 1024 + 1)
    if len(data) > MAX_BATCH_BYTES + 1024 * 1024:
        raise ValueError('Object exceeds size limit')
    return data


def inventory(store, prefix='archive/v1/manifests/'):
    # Reconcile the entire manifest inventory. Never use last-filename cursors:
    # lexically older objects can arrive after a previous scan.
    if 'directory' in store:
        for path in sorted((store['directory'] / prefix).glob('*.json')):
            yield path.relative_to(store['directory']).as_posix()
    else:
        pages = store['client'].get_paginator('list_objects_v2')
        for page in pages.paginate(Bucket=store['bucket'], Prefix=prefix):
            for item in page.get('Contents', []):
                if item['Key'].endswith('.json'):
                    yield item['Key']


def publish(store, events):
    key, manifest, data = encode_batch(events)
    put_immutable(store, manifest['object_key'], data)
    # The manifest is the commit marker. Orphan data objects are harmless.
    put_immutable(store, key, json_bytes(manifest))
    return key, manifest
