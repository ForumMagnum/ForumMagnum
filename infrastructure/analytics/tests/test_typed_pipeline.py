import json
import os
from datetime import datetime

import pytest

from archive import envelope, publish
from clickhouse import ch
from extraction import EXTRACTOR_FINGERPRINT
from pipeline import cycle, initialize, load_batch, replay
from typed_schema import EVENTS_VIEW, RAW_TABLE, RECEIPTS_TABLE
from typed_pipeline import load_group, read_manifest

pytestmark = pytest.mark.skipif(os.environ.get('ANALYTICS_INTEGRATION') != '1', reason='Opt-in local integration')


def configuration(databases):
    connection, legacy, store, dsn = databases
    typed = {**legacy, 'event_schema': 'typed-v1', 'statistics': {}}
    initialize(typed)
    return connection, typed, store


def archived(store, source_id, payload, event_type='pageLoadFinished'):
    event = envelope((str(source_id), 'lesswrong.com', event_type, datetime(2026, 1, 1),
                      json.dumps(payload), None))
    return publish(store, [event])[0]


def rows(config, columns='*'):
    return list(map(json.loads, ch(config, f'SELECT {columns} FROM {EVENTS_VIEW} ORDER BY event_id FORMAT JSONEachRow').splitlines()))


def test_typed_roundtrip_and_derived_intervals(databases):
    _, config, store = configuration(databases)
    payload = {'browserProps': {'userAgent': 'browser', 'mobile': False},
               'postIds': ['b', 'a', 'b'], 'abTestGroups': {'a': 'control'},
               'postVisibility': {'p': False},
               'postMountData': [{'postId': 'p', 'baseScore': 0, 'score': 1.5}],
               'postIdsWithScenario': [{'postId': 'p', 'scenario': 's', 'generatedAt': 'g'}],
               'performance': {'timing': {'navigationStart': 1000, 'requestStart': 1100,
                               'responseStart': 1150, 'responseEnd': 1200,
                               'loadEventEnd': 0, 'domInteractive': 1400}}}
    key = archived(store, 1, payload)
    load_batch(store, config, key)
    row = rows(config)[0]
    assert row['user_agent'] == 'browser' and row['browser_mobile'] is False
    assert row['property_sources'] == {'user_agent': 'browserProps.userAgent'}
    assert row['post_ids'] == ['b', 'a', 'b']
    assert row['ab_test_groups'] == {'a': 'control'}
    assert row['post_visibility'] == {'p': False}
    assert row['post_mount_data'] == [{'post_id': 'p', 'base_score': '0', 'score': 1.5}]
    assert row['page_ttfb_ms'] == '50' and row['page_dom_interactive_ms'] == '400'
    assert row['page_load_ms'] is None
    assert row['extractor_fingerprint'] == EXTRACTOR_FINGERPRINT
    assert json.loads(row['event_json']) == payload
    replay(store, config)
    assert len(rows(config)) == 1
    assert ch(config, 'SELECT count() FROM analytics.events').strip() == '0'


def test_array_nulls_absence_and_bad_payload_do_not_drop_events(databases):
    _, config, store = configuration(databases)
    for identity, payload in enumerate(({}, {'postIds': None}, {'postIds': []}, {'postIds': 1}, None), 1):
        archived(store, identity, payload)
    replay(store, config)
    result = rows(config, 'event_id,post_ids,property_present,property_null,property_invalid,payload_layout')
    assert len(result) == 5
    assert all(r['post_ids'] == [] for r in result)
    assert 'post_ids' not in result[0]['property_present']
    assert result[1]['property_null'] == ['post_ids']
    assert result[2]['property_present'] == ['post_ids']
    assert result[3]['property_invalid'] == ['post_ids']
    assert result[4]['payload_layout'] == 'non_object'


@pytest.mark.parametrize('failure', ['after_archive', 'after_insert', 'after_receipt', 'before_ack', 'after_ack'])
def test_typed_ack_boundaries_recover_without_duplicate_counts(databases, failure):
    connection, config, store = configuration(databases)
    connection.execute('INSERT INTO raw (id,event) VALUES (1,\'{"increment":0}\'), (2,\'{"increment":5}\')')
    with pytest.raises(RuntimeError, match='Injected crash'):
        cycle(connection, store, config, failpoint=failure)
    cycle(connection, store, config)
    assert len(rows(config)) == 2
    assert connection.execute('SELECT count(*) FROM analytics_export.pending').fetchone()[0] == 0
    assert ch(config, f'SELECT sum(increment) FROM {EVENTS_VIEW}').strip() == '5'


def test_grouped_replay_reduces_requests_and_checks_conflicts(databases):
    _, config, store = configuration(databases)
    for identity in range(20):
        archived(store, identity, {'userId': 'same-user'})
    config['statistics']['requests'] = 0
    result = replay(store, config)
    assert result['manifests_reconciled'] == 20 and result['groups'] == 1
    assert config['statistics']['requests'] == 5
    config['statistics']['requests'] = 0
    replay(store, config)
    assert config['statistics']['requests'] == 1
    conflict = archived(store, 1, {'userId': 'conflicting-user'})
    with pytest.raises(ValueError, match='Conflicting canonical identity'):
        load_batch(store, config, conflict)
    assert len(rows(config)) == 20


def test_extractor_receipt_mismatch_fails_closed(databases):
    _, config, store = configuration(databases)
    key = archived(store, 1, {})
    load_batch(store, config, key)
    ch(config, f"ALTER TABLE {RECEIPTS_TABLE} UPDATE extractor_fingerprint = repeat('0',64) WHERE 1 SETTINGS mutations_sync=1")
    with pytest.raises(ValueError, match='extractor'):
        load_batch(store, config, key)
    assert len(rows(config)) == 1


def test_legacy_receipt_does_not_skip_typed_import(databases):
    _, legacy, store, _ = databases
    key = archived(store, 1, {'props': {'eventProps': {'from': '/a', 'to': '/b'}}, 'type': 'navigate'}, 'navigate')
    load_batch(store, legacy, key)
    config = {**legacy, 'event_schema': 'typed-v1'}
    initialize(config)
    load_batch(store, config, key)
    assert rows(config)[0]['navigation_to'] == '/b'
    # Reconstruct typed storage solely from the unchanged archive.
    ch(config, f'TRUNCATE TABLE {RAW_TABLE}')
    ch(config, f'TRUNCATE TABLE {RECEIPTS_TABLE}')
    replay(store, config)
    assert rows(config)[0]['navigation_from'] == '/a'


def test_group_limits_split_replay_and_reject_direct_oversized_calls(databases, monkeypatch):
    _, config, store = configuration(databases)
    manifests = {}
    for identity in range(3):
        key = archived(store, identity, {})
        manifests[key] = read_manifest(store, key)
    monkeypatch.setattr('typed_pipeline.MAX_ROWS', 2)
    with pytest.raises(ValueError, match='group exceeds'):
        load_group(store, config, manifests)
    assert rows(config) == []
    assert replay(store, config)['groups'] == 2
    assert len(rows(config)) == 3


def test_partial_group_retry_and_timestamp_roundtrip(databases):
    _, config, store = configuration(databases)
    first = archived(store, 1, {'timeToCapture': '2024-01-01T01:00:00.123+01:00'}, 'hoverEventTriggered')
    archived(store, 2, {'postIdsWithScenario': [{'postId': 'p', 'scenario': 'curated'}]})
    with pytest.raises(RuntimeError, match='after_insert'):
        load_batch(store, config, first, 'after_insert')
    replay(store, config)
    result = rows(config)
    assert len(result) == 2 and result[0]['hover_captured_at'] == '2024-01-01 00:00:00.123000'
    assert result[1]['post_ids_with_scenario'][0]['generated_at'] is None
    assert ch(config, f'SELECT count() FROM {RECEIPTS_TABLE} FINAL').strip() == '2'
