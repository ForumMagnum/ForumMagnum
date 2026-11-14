"""Boundaries, source consistency and crash recovery for the standalone worker."""

import json
import os
from datetime import datetime, timezone

import psycopg
import pytest

from archive import digest, get_object, inventory, json_bytes
from backfill import (ResourceLimit, check_resources, run, validate_job,
                      verify_source, window_key, windows)
from clickhouse import ch
from extraction import EXTRACTOR_FINGERPRINT
from pipeline import initialize
from typed_schema import EVENTS_VIEW


def job():
    return {'name': 'fixture-year', 'start': '2026-01-01T00:00:00Z', 'end': '2026-01-01T12:00:00Z',
            'deadline': '2028-01-01T00:00:00Z', 'window_hours': 6, 'batch_rows': 2,
            'minimum_free_bytes': 0, 'minimum_free_fraction': 0.001,
            'source_identity': digest(json_bytes({'host': '127.0.0.1', 'port': 58439, 'database': 'analytics_fixture'})),
            'archive_bucket': 'fixture',
            'extractor_fingerprint': EXTRACTOR_FINGERPRINT}


def test_windows_have_exact_half_open_coverage():
    values = list(windows(validate_job(job())))
    assert values == [
        (datetime(2026, 1, 1, 6, tzinfo=timezone.utc), datetime(2026, 1, 1, 12, tzinfo=timezone.utc)),
        (datetime(2026, 1, 1, 0, tzinfo=timezone.utc), datetime(2026, 1, 1, 6, tzinfo=timezone.utc))]
    with pytest.raises(ValueError, match='timezone'):
        validate_job({**job(), 'start': '2026-01-01'})
    with pytest.raises(ValueError, match='extractor'):
        validate_job({**job(), 'extractor_fingerprint': 'wrong'})


def test_resources_stop_before_more_source_reads(tmp_path):
    with pytest.raises(ResourceLimit, match='disk_reserve'):
        check_resources({**job(), 'minimum_free_bytes': 2**63}, tmp_path)
    with pytest.raises(ResourceLimit, match='deadline'):
        check_resources({**job(), 'deadline': '2025-01-01T00:00:00Z'}, tmp_path)


integration = pytest.mark.skipif(os.environ.get('ANALYTICS_INTEGRATION') != '1', reason='Opt-in local integration')


def setup(databases):
    connection, legacy, store, dsn = databases
    connection.execute('DROP TRIGGER analytics_archive_capture ON raw')
    connection.execute('CREATE INDEX fixture_timestamp ON raw(timestamp)')
    connection.execute('''INSERT INTO raw(id,timestamp,event) VALUES
        (1,'2025-12-31 23:59:59.999999','{}'),
        (2,'2026-01-01 00:00:00','{"to":"/a"}'),
        (3,'2026-01-01 05:59:59.999999','{}'),
        (4,'2026-01-01 06:00:00','{}'),
        (5,'2026-01-01 06:00:00','{}'),
        (6,'2026-01-01 12:00:00','{}')''')
    connection.execute('SET enable_seqscan=off')
    config = {**legacy, 'event_schema': 'typed-v1'}
    initialize(config)
    return connection, config, store, dsn


@integration
@pytest.mark.parametrize('failure', ['after_archive', 'after_insert', 'after_receipt', 'before_window_checkpoint'])
def test_resume_incomplete_window_and_preserve_complete_windows(databases, tmp_path, failure):
    connection, config, store, dsn = setup(databases)
    with pytest.raises(RuntimeError, match='Injected crash'):
        run(connection, store, config, job(), tmp_path, failure)
    newest_start = list(windows(job()))[0][0]
    assert not (store['directory'] / window_key(job(), newest_start)).exists()
    with psycopg.connect(dsn, autocommit=True) as writer:
        writer.execute("INSERT INTO raw(id,timestamp) VALUES (0, '2026-01-01 07:00:00')")
    result = run(connection, store, config, job(), tmp_path)
    assert result['completed_rows'] == 5 and result['completed_windows'] == 2
    assert ch(config, f'SELECT count() FROM {EVENTS_VIEW}').strip() == '5'
    record = json.loads(get_object(store, window_key(job(), newest_start)))
    assert record['complete'] and record['rows'] == 3 and record['source_snapshot']
    with psycopg.connect(dsn, autocommit=True) as writer:
        writer.execute("INSERT INTO raw(id,timestamp) VALUES (7, '2026-01-01 07:00:00')")
    again = run(connection, store, config, job(), tmp_path)
    assert again['completed_rows'] == 5
    assert ch(config, f'SELECT count() FROM {EVENTS_VIEW}').strip() == '5'
    assert connection.execute('SHOW transaction_read_only').fetchone()[0] == 'on'


@integration
def test_changed_job_and_low_disk_fail_closed(databases, tmp_path):
    connection, config, store, _ = setup(databases)
    limited = {**job(), 'minimum_free_bytes': 2**63}
    with pytest.raises(ResourceLimit, match='disk_reserve'):
        run(connection, store, config, limited, tmp_path)
    assert list(inventory(store)) == []
    assert json.loads((tmp_path / 'status.json').read_text())['state'] == 'blocked'
    with pytest.raises(ValueError, match='Immutable object conflict'):
        run(connection, store, config, {**job(), 'start': '2025-12-31T00:00:00Z'}, tmp_path)
    assert run(connection, store, config, job(), tmp_path)['state'] == 'complete'


@integration
def test_real_source_privilege_and_identity_guards(databases, monkeypatch):
    connection, _, _, _ = setup(databases)
    monkeypatch.delenv('ANALYTICS_TEST_MODE')
    with pytest.raises(ValueError, match='SELECT-only'):
        verify_source(connection, job())
    connection.execute('CREATE ROLE lw_backfill_fixture NOLOGIN')
    try:
        connection.execute('GRANT USAGE ON SCHEMA public TO lw_backfill_fixture')
        connection.execute('GRANT SELECT ON raw TO lw_backfill_fixture')
        connection.execute('SET ROLE lw_backfill_fixture')
        verify_source(connection, job())
        with pytest.raises(ValueError, match='source differs'):
            verify_source(connection, {**job(), 'source_identity': 'wrong'})
        connection.execute('RESET ROLE')
        connection.execute('GRANT INSERT ON raw TO lw_backfill_fixture')
        connection.execute('SET ROLE lw_backfill_fixture')
        with pytest.raises(ValueError, match='SELECT-only'):
            verify_source(connection, job())
    finally:
        connection.execute('RESET ROLE')
        connection.execute('REVOKE ALL ON raw FROM lw_backfill_fixture')
        connection.execute('REVOKE ALL ON SCHEMA public FROM lw_backfill_fixture')
        connection.execute('DROP ROLE lw_backfill_fixture')
