import os

import httpx
import pytest

from pipeline import ch, initialize

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
