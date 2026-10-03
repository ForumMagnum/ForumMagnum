"""Replay private archives on the disposable fixture and report aggregate metrics.

This command resets the local analytics fixture only. It never connects to RDS,
changes an archive, or outputs event values. Projection readback compares all
selected fields, raw JSON and metadata for each requested validation archive.
"""

import argparse
import json
import math
import os
import resource
import sys
import time
from pathlib import Path

from archive import decode_batch, get_object, inventory
from clickhouse import ch, clickhouse_config, clickhouse_session
from extraction import EXTRACTOR_FINGERPRINT, FIELDS, extract
from pipeline import initialize
from typed_pipeline import external_strings, read_manifest, replay_typed
from typed_schema import DURATIONS, EVENTS_VIEW, RAW_TABLE

COLUMN_NAMES = {field['column'] for field in FIELDS}


def decoded_column(field, value):
    # JSONEachRow quotes Int64 values to protect client precision.
    if field['kind'] == 'integer' and value is not None:
        return int(value)
    if field['kind'] == 'post_mounts':
        return [{**item, 'base_score': int(item['base_score']) if item['base_score'] is not None else None}
                for item in value]
    return value


def same_value(actual, expected, rounding):
    if actual == expected:
        return True
    if isinstance(expected, float) and type(actual) in (float, int) and math.isfinite(actual):
        # The pinned 26.3 JSON number parser can introduce a few Float64 ULPs
        # beyond Python's conversion. Do not weaken exact IDs/counts/raw JSON or
        # use a broad absolute epsilon that hides errors in small measurements.
        ulps = abs(actual - expected) / max(math.ulp(actual), math.ulp(expected))
        if ulps <= 4:
            rounding['values'] += 1
            rounding['max_ulps'] = max(rounding['max_ulps'], ulps)
            return True
        return False
    if isinstance(expected, list) and isinstance(actual, list) and len(actual) == len(expected):
        return all(same_value(a, b, rounding) for a, b in zip(actual, expected))
    if isinstance(expected, dict) and isinstance(actual, dict) and actual.keys() == expected.keys():
        return all(same_value(actual[key], value, rounding) for key, value in expected.items())
    return False


def validate_projection(store, config):
    rows = 0
    rounding = {'values': 0, 'max_ulps': 0}
    started = time.monotonic()
    for key in inventory(store):
        manifest = read_manifest(store, key)
        expected = decode_batch(manifest, get_object(store, manifest['object_key']), prepare=extract)
        # Bound readback independently of archive grouping and large JSON values.
        for offset in range(0, len(expected), 1000):
            wanted = {row['event_id']: row for row in expected[offset:offset + 1000]}
            result = ch(config, f'''SELECT * FROM {EVENTS_VIEW}
                WHERE event_id IN (SELECT event_id FROM wanted) FORMAT JSONEachRow''',
                external=external_strings('wanted', 'event_id', wanted))
            observed = set()
            for actual in map(json.loads, result.splitlines()):
                wanted_row = wanted[actual['event_id']]
                observed.add(actual['event_id'])
                for field in FIELDS:
                    column = field['column']
                    empty = {} if field['kind'].endswith('_map') else (
                        [] if field['kind'] in ('strings', 'numbers', 'post_mounts', 'post_scenarios') else None)
                    if not same_value(decoded_column(field, actual[column]), wanted_row.get(column, empty), rounding):
                        raise ValueError('Projection readback mismatch in ' + column)
                for column, value in wanted_row.items():
                    if column not in COLUMN_NAMES and actual[column] != value:
                        raise ValueError('Envelope/metadata readback mismatch in ' + column)
                for column, (start, end) in DURATIONS.items():
                    a, b = wanted_row.get(start), wanted_row.get(end)
                    value = b - a if wanted_row['event_type'] == 'pageLoadFinished' and a and b is not None and b >= a and a > 0 else None
                    if (int(actual[column]) if actual[column] is not None else None) != value:
                        raise ValueError('Derived readback mismatch in ' + column)
            if observed != set(wanted):
                raise ValueError('Projection readback is missing events')
            rows += len(wanted)
    return {'rows_checked': rows, 'seconds': time.monotonic() - started, 'float_rounding': rounding}


def print_progress(value):
    print(json.dumps(value), flush=True)


def measure(directories, verify_directories):
    config = clickhouse_config()
    if (os.environ.get('ANALYTICS_TEST_MODE') != '1'
            or config['url'] != 'http://127.0.0.1:58123' or config['user'] != 'fixture'):
        raise ValueError('Measurement reset is restricted to the disposable local fixture')
    config = {**config, 'event_schema': 'typed-v1', 'statistics': {}}
    ch(config, 'DROP DATABASE IF EXISTS analytics SYNC')
    initialize(config)
    imports = []
    with clickhouse_session(config) as session:
        for directory in directories:
            session['statistics']['requests'] = 0
            result = replay_typed({'directory': directory}, session, print_progress)
            imports.append({**result, 'http_requests': session['statistics']['requests']})
            print_progress({'import': imports[-1]})
        validations = [validate_projection({'directory': directory}, session) for directory in verify_directories]
        ch(session, f'OPTIMIZE TABLE {RAW_TABLE} FINAL', timeout=None)
        # Build the legacy layout from the exact same canonical rows, excluding
        # load time: this is a storage comparison, not a legacy-speed benchmark.
        initialize({**session, 'event_schema': 'legacy'})
        columns = 'schema_version,event_id,source_id,event_time,received_at,environment,event_type,event_json,content_hash'
        ch(session, f'INSERT INTO analytics.raw_events ({columns}) SELECT {columns} FROM {EVENTS_VIEW}', timeout=None)
        ch(session, 'OPTIMIZE TABLE analytics.raw_events FINAL', timeout=None)
        storage = list(map(json.loads, ch(session, '''SELECT table, sum(rows) rows,
            sum(data_compressed_bytes) compressed_bytes, sum(bytes_on_disk) bytes_on_disk
            FROM system.parts WHERE active AND database='analytics'
            AND table IN ('raw_events','raw_events_typed_v1') GROUP BY table FORMAT JSONEachRow''').splitlines()))
        # Independent raw-JSON expressions verify the most common event semantics.
        mismatches = json.loads(ch(session, f'''SELECT
            countIf(event_type='timerEvent' AND NOT isNotDistinctFrom(increment, JSONExtract(event_json,'increment','Nullable(Int64)'))) timer_increment,
            countIf(event_type='navigate' AND payload_layout='object' AND JSONType(event_json,'to')='String' AND NOT isNotDistinctFrom(navigation_to, JSONExtract(event_json,'to','Nullable(String)'))) navigation_to,
            countIf(event_type='pageLoadFinished' AND payload_layout='object' AND NOT isNotDistinctFrom(browser_response_start, JSONExtract(event_json,'performance','timing','responseStart','Nullable(Int64)'))) browser_response_start
            FROM {EVENTS_VIEW} FORMAT JSONEachRow'''))
        if any(int(value) for value in mismatches.values()):
            raise ValueError('Independent common-event comparisons failed')
        logical_rows = int(ch(session, f'SELECT count() FROM {EVENTS_VIEW}'))
    peak_rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    return {'extractor_fingerprint': EXTRACTOR_FINGERPRINT, 'properties': len(FIELDS),
            'imports': imports, 'projection_readbacks': validations, 'storage': storage,
            'logical_rows': logical_rows, 'common_event_mismatches': mismatches,
            'python_peak_rss_bytes': peak_rss if sys.platform == 'darwin' else peak_rss * 1024,
            'limitation': 'Local archived-input fixture; excludes RDS export, S3 transfer and full-history query scaling.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', required=True, action='append', type=Path)
    parser.add_argument('--verify-archive', default=[], action='append', type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    result = measure(args.archive, args.verify_archive)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print_progress(result)
