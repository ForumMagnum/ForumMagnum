"""Measure a private, bounded sample on the explicitly disposable local fixture.

Input is a JSON array of id (string), environment, event_type, event_time (UTC
text), event_json (original PostgreSQL JSONB text). Outputs only aggregate metrics.
Never commit the input. This is functional evidence, not a full-history benchmark.
"""

import argparse
import json
import os
import time
from collections import Counter
from pathlib import Path
from uuid import uuid4

from archive import encode_batch, envelope, publish
from pipeline import ch, clickhouse_config, initialize, load_batch


def measure(path, archive_directory):
    config = clickhouse_config()
    if (os.environ.get('ANALYTICS_TEST_MODE') != '1' or
            config['url'] != 'http://127.0.0.1:58123' or config['user'] != 'fixture'):
        raise ValueError('Measurement reset is restricted to the disposable local fixture')
    rows = json.loads(path.read_text())
    events = [envelope((row['id'], row['environment'], row['event_type'], row['event_time'],
                        row['event_json'], None)) for row in rows]
    ch(config, 'DROP DATABASE IF EXISTS analytics SYNC')
    initialize(config)
    store = {'directory': archive_directory}
    started = time.monotonic()
    key, _ = publish(store, events)
    load_batch(store, config, key)
    import_seconds = time.monotonic() - started
    ch(config, 'OPTIMIZE TABLE analytics.raw_events FINAL')
    parts = json.loads(ch(config, '''SELECT sum(rows) rows, sum(data_compressed_bytes) compressed_bytes,
        sum(data_uncompressed_bytes) uncompressed_bytes, sum(bytes_on_disk) bytes_on_disk
        FROM system.parts WHERE active AND database='analytics' AND table='raw_events' FORMAT JSONEachRow'''))
    environment = Counter(row['environment'] for row in rows).most_common(1)[0][0]
    queries = {}
    for name in ('traffic', 'breakdown', 'retention'):
        sql = (Path(__file__).parent / 'queries' / f'{name}.sql').read_text().rstrip().rstrip(';')
        query_id = str(uuid4())
        started = time.monotonic()
        result = ch(config, sql + ' FORMAT JSON',
                    {'environment': environment, 'start': '2020-01-01 00:00:00', 'end': '2027-01-01 00:00:00'},
                    query_id=query_id)
        latency = time.monotonic() - started
        parsed = json.loads(result)
        ch(config, 'SYSTEM FLUSH LOGS')
        stats = ch(config, '''SELECT query_duration_ms, memory_usage, read_rows FROM system.query_log
            WHERE query_id={id:String} AND type='QueryFinish' ORDER BY event_time DESC LIMIT 1 FORMAT JSONEachRow''',
            {'id': query_id})
        queries[name] = {'wall_seconds': latency, 'result_rows': parsed['rows'],
                         'server': json.loads(stats) if stats.strip() else None}
        if name in ('traffic', 'breakdown'):
            assert sum(int(row['events']) for row in parsed['data']) == sum(row['environment'] == environment for row in rows)
    _, _, compressed_archive = encode_batch(events)
    return {'sample_rows': len(rows), 'event_types': len(set(row['event_type'] for row in rows)),
            'max_payload_bytes': max(len(row['event_json'].encode()) for row in rows),
            'archive_compressed_bytes': len(compressed_archive), 'import_seconds': import_seconds,
            'active_parts': parts, 'queries': queries,
            'limitation': 'Tiny indexed time slices; functional checks only. No reliable full-history size/runtime extrapolation.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source_json', type=Path)
    parser.add_argument('--private-archive', required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(measure(args.source_json, args.private_archive), indent=2))
