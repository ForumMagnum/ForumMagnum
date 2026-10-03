import os
from datetime import datetime

import httpx
import pytest

from archive import envelope, publish
from pipeline import ch, initialize, load_batch

pytestmark = pytest.mark.skipif(os.environ.get('ANALYTICS_TEST_ROLES') != '1', reason='Requires fixture role config')


def request(config, sql):
    return httpx.post(config['url'], content=sql, auth=('analytics_query', 'q' * 32), timeout=10)


def test_query_role_cannot_write_bypass_view_or_expand_resources(databases):
    _, config, _, _ = databases
    assert request(config, 'SELECT count() FROM analytics.events').status_code == 200
    query_config = {**config, 'user': 'analytics_query', 'password': 'q' * 32, 'read_only': True}
    assert ch(query_config, 'SELECT count() FROM analytics.events').strip() == '0'
    for sql in (
        'SELECT * FROM analytics.raw_events',
        'SELECT * FROM analytics.applied_batches',
        'DROP TABLE analytics.raw_events',
        'SELECT 1 SETTINGS readonly = 0',
        'SELECT 1 SETTINGS max_memory_usage = 0',
        'SELECT 1 SETTINGS max_result_rows = 0',
        'SELECT 1 SETTINGS max_execution_time = 0',
        "SELECT * FROM url('http://169.254.169.254/latest/meta-data/', 'CSV', 'x String')",
    ):
        assert request(config, sql).status_code != 200, sql


def test_maintenance_can_create_the_production_view(databases):
    _, config, _, _ = databases
    admin = {**config, 'user': 'analytics_maintenance', 'password': 'q' * 32}
    ch(config, 'DROP DATABASE analytics SYNC')
    initialize(admin)
    assert request(config, 'SELECT count() FROM analytics.events').status_code == 200


def test_typed_roles_can_use_only_their_granted_tables(databases):
    _, config, store, _ = databases
    admin = {**config, 'user': 'analytics_maintenance', 'password': 'q' * 32, 'event_schema': 'typed-v1'}
    initialize(admin)
    event = envelope(('1', 'fixture', 'navigate', datetime(2026, 1, 1), '{"to":"/destination"}', None))
    key, _ = publish(store, [event])
    ingest = {**config, 'user': 'analytics_ingest', 'password': 'q' * 32, 'event_schema': 'typed-v1'}
    load_batch(store, ingest, key)
    assert request(config, 'SELECT page_ttfb_ms FROM analytics.events_typed_v1').status_code == 200
    assert request(config, 'SELECT navigation_to FROM analytics.events_typed_v1').text.strip() == '/destination'
    for table in ('raw_events_typed_v1', 'applied_batches_typed_v1'):
        assert request(config, f'SELECT * FROM analytics.{table}').status_code != 200
        assert request(config, f'TRUNCATE TABLE analytics.{table}').status_code != 200
