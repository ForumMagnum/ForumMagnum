"""Bounded local source-overhead measurement; never accepts production databases."""

import json
import os
import statistics
import time
from pathlib import Path

import psycopg


def insert_batches(connection, start, batches=50, batch_size=1000):
    durations = []
    for batch in range(batches):
        before = time.perf_counter()
        connection.execute('''INSERT INTO impact_fixture.raw (id, event)
            SELECT value, jsonb_build_object('userId', 'fixture-' || (value %% 300),
                'clientId', 'client-' || value, 'payload', repeat('x', 500))
            FROM generate_series(%s::bigint, %s::bigint) value''',
                           (start + batch * batch_size, start + (batch + 1) * batch_size - 1))
        durations.append(time.perf_counter() - before)
    return {'batches': batches, 'rows': batches * batch_size,
            'median_batch_ms': statistics.median(durations) * 1000,
            'p95_batch_ms': sorted(durations)[int(len(durations) * 0.95) - 1] * 1000,
            'total_seconds': sum(durations)}


def main():
    if os.environ.get('ANALYTICS_TEST_MODE') != '1':
        raise ValueError('Explicit local test mode required')
    with psycopg.connect(os.environ['ANALYTICS_SOURCE_DSN'], autocommit=True) as connection:
        if connection.info.dbname != 'analytics_fixture' or connection.info.host != '127.0.0.1':
            raise ValueError('Only local analytics_fixture is allowed')
        connection.execute('DROP SCHEMA IF EXISTS impact_capture CASCADE; DROP SCHEMA IF EXISTS impact_fixture CASCADE')
        connection.execute('CREATE SCHEMA impact_fixture; CREATE TABLE impact_fixture.raw (id bigint UNIQUE, event jsonb)')
        baseline = insert_batches(connection, 1)
        ddl = (Path(__file__).parent / 'sql/001_capture.sql').read_text()
        connection.execute(ddl.replace('analytics_export', 'impact_capture').replace('public.raw', 'impact_fixture.raw'))
        captured = insert_batches(connection, 50001)
        count = connection.execute('SELECT count(*) FROM impact_capture.pending').fetchone()[0]
        assert count == 50000
        queue_bytes = connection.execute("SELECT pg_total_relation_size('impact_capture.pending')").fetchone()[0]
        before = time.perf_counter()
        for _ in range(50):
            connection.execute('''DELETE FROM impact_capture.pending WHERE raw_id IN
                (SELECT raw_id FROM impact_capture.pending ORDER BY raw_id LIMIT 1000)''')
        drain_seconds = time.perf_counter() - before
        connection.execute('VACUUM (ANALYZE) impact_capture.pending')
        remaining = connection.execute('SELECT count(*) FROM impact_capture.pending').fetchone()[0]
        assert remaining == 0
        print(json.dumps({'baseline': baseline, 'with_trigger': captured, 'queue_bytes': queue_bytes,
                          'drain_seconds': drain_seconds, 'remaining_after_vacuum': remaining,
                          'limitation': 'Local fixture only; no RDS latency, I/O, or production-load guarantee.'}, indent=2))


if __name__ == '__main__':
    main()
