"""Opt-in tests: ONLY an explicitly identified disposable database is accepted."""

import json
import os

import psycopg
import pytest

from archive import publish
from pipeline import (ch, cycle, export_snapshot, initialize,
                      load_batch, read_pending, replay, source_lease)
import pipeline

pytestmark = pytest.mark.skipif(os.environ.get('ANALYTICS_INTEGRATION') != '1', reason='Opt-in local integration')




def logical_count(config):
    return int(ch(config, 'SELECT count() FROM analytics.events'))


def test_late_commit_rollback_and_replay(databases):
    connection, config, store, dsn = databases
    with psycopg.connect(dsn) as late:
        late.execute('INSERT INTO raw (id) VALUES (1)')
        connection.execute('INSERT INTO raw (id) VALUES (2)')
        assert cycle(connection, store, config)['complete']
        assert logical_count(config) == 1
        late.commit()
    with psycopg.connect(dsn) as rollback:
        rollback.execute('INSERT INTO raw (id) VALUES (3)')
        rollback.rollback()
    cycle(connection, store, config)
    replay(store, config)
    assert logical_count(config) == 2
    assert connection.execute('SELECT count(*) FROM analytics_export.pending').fetchone()[0] == 0


@pytest.mark.parametrize('failure', ['after_archive', 'after_insert', 'after_receipt', 'before_ack', 'after_ack'])
def test_crash_at_each_ack_boundary(databases, failure):
    connection, config, store, _ = databases
    connection.execute('INSERT INTO raw (id) VALUES (1),(2)')
    with pytest.raises(RuntimeError, match='Injected crash'):
        cycle(connection, store, config, failpoint=failure)
    cycle(connection, store, config)
    assert logical_count(config) == 2
    assert connection.execute('SELECT count(*) FROM analytics_export.pending').fetchone()[0] == 0


def test_receipt_failure_and_conflicting_identity(databases):
    connection, config, store, _ = databases
    connection.execute('INSERT INTO raw (id) VALUES (1)')
    event = read_pending(connection)[0]
    key, _ = publish(store, [event])
    load_batch(store, config, key)
    connection.execute("UPDATE raw SET event = '{\"changed\":true}' WHERE id = 1")
    changed = read_pending(connection)[0]
    key, _ = publish(store, [changed])
    with pytest.raises(ValueError, match='Conflicting canonical identity'):
        load_batch(store, config, key)
    assert logical_count(config) == 1
    assert len(read_pending(connection)) == 1


def test_source_failure_is_atomic_and_permissions_are_isolated(databases):
    connection, _, _, _ = databases
    with pytest.raises(psycopg.errors.NotNullViolation):
        connection.execute('INSERT INTO raw (id) VALUES (NULL)')
    assert connection.execute('SELECT count(*) FROM raw').fetchone()[0] == 0
    connection.execute('ALTER TABLE analytics_export.pending ADD CONSTRAINT fixture_failure CHECK (raw_id <> 7)')
    with pytest.raises(psycopg.errors.CheckViolation):
        connection.execute('INSERT INTO raw (id) VALUES (6),(7)')
    assert connection.execute('SELECT count(*) FROM raw').fetchone()[0] == 0
    connection.execute("DO $$ BEGIN CREATE ROLE fixture_writer; EXCEPTION WHEN duplicate_object THEN NULL; END $$")
    connection.execute('GRANT INSERT ON raw TO fixture_writer')
    connection.execute('SET ROLE fixture_writer')
    connection.execute('INSERT INTO raw (id) VALUES (8)')
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        connection.execute('SELECT * FROM analytics_export.pending')
    connection.execute('RESET ROLE')
    assert len(read_pending(connection)) == 1


def test_source_lease_excludes_second_exporter(databases):
    connection, _, _, dsn = databases
    with source_lease(connection), psycopg.connect(dsn, autocommit=True) as other:
        with pytest.raises(RuntimeError, match='Another exporter'):
            with source_lease(other):
                pass


def test_historical_overlap_and_rebuild_from_archive(databases):
    connection, config, store, _ = databases
    connection.execute('INSERT INTO raw (id) VALUES (1),(2)')
    exported = export_snapshot(connection, store, 'fixture-snapshot')
    assert exported['complete_segment']
    replay(store, config)
    cycle(connection, store, config)
    assert logical_count(config) == 2
    # Simulates loss of ALL local database data and receipts.
    ch(config, 'DROP DATABASE analytics SYNC')
    initialize(config)
    replay(store, config)
    assert logical_count(config) == 2


def test_payload_precision_and_distinct_identities(databases):
    connection, config, store, _ = databases
    payload = '{"n":12345678901234567890.123456789,"userId":"u","clientId":"c","tabId":"t","sessionId":"s","null":null}'
    connection.execute('INSERT INTO raw (id,event) VALUES (%s,%s::jsonb)', (9007199254740993, payload))
    cycle(connection, store, config)
    result = json.loads(ch(config, 'SELECT * FROM analytics.events FORMAT JSONEachRow'))
    assert result['source_id'] == '9007199254740993'
    assert '12345678901234567890.123456789' in result['event_json']
    assert [result[key] for key in ('user_id', 'client_id', 'tab_id', 'session_id')] == ['u', 'c', 't', 's']


def test_byte_limited_batches_leave_remaining_rows_pending(databases, monkeypatch):
    connection, config, store, _ = databases
    connection.execute('INSERT INTO raw (id,event) SELECT id, jsonb_build_object(\'value\', repeat(\'x\', 2000)) FROM generate_series(1,40) id')
    monkeypatch.setattr(pipeline, 'MAX_BATCH_BYTES', 6000)
    events = read_pending(connection)
    assert len(events) == 2
    assert cycle(connection, store, config, max_batches=1)['complete'] is False
    assert connection.execute('SELECT count(*) FROM analytics_export.pending').fetchone()[0] == 38
    exported = export_snapshot(connection, store, 'byte-limited')
    assert exported['complete_segment']
    replay(store, config)
    assert logical_count(config) == 40
    cycle(connection, store, config)
    assert logical_count(config) == 40


def test_missing_pending_source_fails_without_acknowledgement(databases):
    connection, _, _, _ = databases
    connection.execute('INSERT INTO raw (id) VALUES (1),(2)')
    connection.execute('DELETE FROM raw WHERE id = 2')
    with pytest.raises(RuntimeError, match='disappeared'):
        read_pending(connection)
    assert connection.execute('SELECT count(*) FROM analytics_export.pending').fetchone()[0] == 2


def test_json_null_does_not_become_a_phantom_identity(databases):
    connection, config, store, _ = databases
    connection.execute('INSERT INTO raw (id,event) VALUES (1,\'{}\'),(2,\'{"userId":null}\'),(3,\'{"userId":"null"}\')')
    cycle(connection, store, config)
    result = json.loads(ch(config, '''SELECT countIf(user_id IS NULL) AS missing,
        uniqExactIf(user_id,user_id IS NOT NULL) AS users,
        countIf(user_id='null') AS literal_null_ids FROM analytics.events FORMAT JSONEachRow'''))
    assert result == {'missing': '2', 'users': '1', 'literal_null_ids': '1'}
