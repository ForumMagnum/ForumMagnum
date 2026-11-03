import json
from datetime import datetime
from decimal import Decimal
from pathlib import Path

import pytest

from archive import decode_batch, encode_batch, envelope
from extraction import EXTRACTOR_FINGERPRINT, FIELDS, extract
from typed_schema import schema_sql


def projected(payload, event_type='timerEvent'):
    event = envelope(('1', 'lesswrong.com', event_type, datetime(2026, 1, 1),
                      json.dumps(payload), None))
    return extract(event, payload)


def test_missing_null_false_zero_empty_and_invalid_are_distinct():
    missing = projected({})
    null = projected({'isVisible': None})
    false = projected({'isVisible': False, 'increment': 0, 'path': '', 'postIds': []})
    invalid = projected({'isVisible': 'false', 'increment': True, 'postIds': ['ok', None]})
    assert 'is_visible' not in missing['property_present']
    assert 'is_visible' in null['property_present']
    assert 'is_visible' in null['property_null']
    assert false['is_visible'] is False and false['increment'] == 0 and false['path'] == ''
    assert false['post_ids'] == [] and 'post_ids' in false['property_present']
    assert set(invalid['property_invalid']) == {'is_visible', 'increment', 'post_ids'}
    assert not any(key in invalid for key in ('is_visible', 'increment', 'post_ids'))


def test_legacy_wrapper_and_normal_props_snapshot():
    payload = {'type': 'navigate', 'clientId': 'outer', 'props': {
        'clientId': 'inner', 'eventProps': {'from': '/a', 'to': '/b', 'tabId': 'tab'}}}
    row = projected(payload, 'navigate')
    assert row['navigation_to'] == '/b' and row['navigation_from'] == '/a'
    assert row['tab_id'] == 'tab' and row['client_id'] == 'outer'
    assert row['property_conflicts'] == ['client_id']
    assert row['property_sources']['navigation_to'] == 'props.eventProps.to'
    assert row['payload_layout'] == 'legacy_event_props'
    assert 'navigation_to' not in projected(payload, 'snapshot')
    assert projected({'props': {'eventProps': {'userId': 'not-an-actor'}}})['property_present'] == []


def test_user_agent_alias_does_not_erase_explicit_null_or_conflicts():
    row = projected({'browserProps': {'userAgent': 'browser'}})
    assert row['user_agent'] == 'browser'
    assert row['property_sources'] == {'user_agent': 'browserProps.userAgent'}
    conflict = projected({'userAgent': None, 'browserProps': {'userAgent': 'browser'}})
    assert 'user_agent' not in conflict
    assert conflict['property_null'] == conflict['property_conflicts'] == ['user_agent']


def test_event_scoping_and_navigation_shapes_preserve_unknowns():
    row = projected({'to': {'pathname': '/post', 'search': '?x=1', 'hash': '#comment'}}, 'linkClicked')
    assert row['navigation_to'] == '/post?x=1#comment'
    assert row['property_normalized'] == ['navigation_to']
    wrong_event = projected({'to': 'compact', 'state': 'subscribed'}, 'subscribeClicked')
    assert set(wrong_event['property_out_of_scope']) == {'navigation_to', 'activity_state'}
    unknown_shape = projected({'to': {'pathname': '/post', 'extra': 'keep'}}, 'navigate')
    assert unknown_shape['property_invalid'] == ['navigation_to']
    assert 'extra' in unknown_shape['event_json']


def test_dates_are_not_guessed_from_numeric_values():
    row = projected({'timeToCapture': '2024-01-01T01:00:00.123+01:00'}, 'hoverEventTriggered')
    assert row['hover_captured_at'] == '2024-01-01 00:00:00.123000'
    for value in (123, '123', '2024-01-01T00:00:00'):
        assert projected({'timeToCapture': value}, 'hoverEventTriggered')['property_invalid'] == ['hover_captured_at']


def test_collections_keep_order_duplicates_and_shapes():
    payload = {'postIds': ['b', 'a', 'b'], 'abTestGroups': {'experiment': 'control'},
               'postVisibility': {'arbitrary-post-id': False},
               'postMountData': [{'postId': 'b', 'baseScore': 0, 'score': 1.5},
                                 {'postId': 'a', 'baseScore': None}],
               'postIdsWithScenario': [{'postId': 'b', 'scenario': 'recommended', 'generatedAt': 'original'},
                                       {'postId': 'a', 'scenario': 'curated'}]}
    row = projected(payload, 'postListMounted')
    assert row['post_ids'] == ['b', 'a', 'b']
    assert row['ab_test_groups'] == {'experiment': 'control'}
    assert row['post_visibility'] == {'arbitrary-post-id': False}
    assert row['post_mount_data'] == [{'post_id': 'b', 'base_score': 0, 'score': 1.5},
                                      {'post_id': 'a', 'base_score': None, 'score': None}]
    assert row['post_ids_with_scenario'][0]['generated_at'] == 'original'
    assert row['post_ids_with_scenario'][1]['generated_at'] is None
    assert projected({'threshold': 0.5}, 'inViewEvent')['threshold'] == [0.5]


def test_precision_limits_and_raw_replay():
    text = '{"userId":"u","limit":9223372036854775808,"mountedPostScore":1e400,"unknown":12345678901234567890.123456789}'
    event = envelope(('9007199254740993', 'lesswrong.com', 'postItemMounted', datetime(2026, 1, 1), text, None))
    _, manifest, body = encode_batch([event])
    row = decode_batch(manifest, body, prepare=extract)[0]
    assert row['event_json'] == text and row['source_id'] == '9007199254740993'
    assert set(row['property_invalid']) == {'list_limit', 'mounted_post_score'}
    assert row['content_hash'] == event['content_hash']
    assert row['extractor_fingerprint'] == EXTRACTOR_FINGERPRINT
    assert row == extract(event, json.loads(text, parse_float=Decimal))


@pytest.mark.parametrize('payload', [None, 12, 'a', [1, 2]])
def test_nonobject_payload_survives(payload):
    row = projected(payload)
    assert row['payload_layout'] == 'non_object'
    assert row['property_present'] == []
    assert json.loads(row['event_json']) == payload


def test_registry_and_checked_in_ddl_are_consistent():
    assert len(FIELDS) == len({f['column'] for f in FIELDS}) == len({f['path'] for f in FIELDS})
    assert (Path(__file__).parents[1] / 'sql/003_typed_events_v1.sql').read_text() == schema_sql()
