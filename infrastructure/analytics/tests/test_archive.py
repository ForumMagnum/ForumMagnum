import json
from datetime import datetime

import pytest

from archive import decode_batch, encode_batch, envelope, get_object, inventory, publish


def sample(source_id='9007199254740993', payload='{"n":12345678901234567890.123456789,"null":null}'):
    return envelope((source_id, 'production', 'timerEvent', datetime(2026, 10, 1), payload, None))


def test_lossless_precision_and_unknown_received_time():
    event = sample()
    _, manifest, body = encode_batch([event])
    decoded = decode_batch(manifest, body)[0]
    assert decoded == event
    assert decoded['source_id'] == '9007199254740993'
    assert '12345678901234567890.123456789' in decoded['event_json']
    assert decoded['received_at'] is None
    assert 'missing' not in json.loads(decoded['event_json'])


def test_stable_producer_identity():
    event = sample(payload='{"_analyticsEventId":"00000000-0000-4000-8000-000000000001"}')
    assert event['event_id'] == 'uuid:00000000-0000-4000-8000-000000000001'


def test_corruption_and_unknown_schema_fail_closed():
    _, manifest, body = encode_batch([sample()])
    with pytest.raises(ValueError):
        decode_batch({**manifest, 'sha256': '0' * 64}, body)
    with pytest.raises(ValueError):
        decode_batch({**manifest, 'schema_version': 99}, body)


def test_publication_idempotent_and_inventory_includes_late_keys(tmp_path):
    store = {'directory': tmp_path}
    first, _ = publish(store, [sample('2')])
    assert first in list(inventory(store))
    second, _ = publish(store, [sample('1')])
    publish(store, [sample('2')])
    assert set(inventory(store)) == {first, second}
    assert json.loads(get_object(store, first))['row_count'] == 1


def test_bad_id_and_oversize_are_unresolved():
    with pytest.raises(ValueError):
        sample(None)
    with pytest.raises(ValueError):
        sample(payload='{"_analyticsEventId":"not-a-uuid"}')
    with pytest.raises(ValueError):
        sample(payload='"' + 'x' * (4 * 1024 * 1024) + '"')
