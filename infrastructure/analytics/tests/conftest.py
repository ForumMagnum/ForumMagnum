import os
from pathlib import Path

import psycopg
import pytest

from pipeline import ch, clickhouse_config, initialize

SQL = Path(__file__).parents[1] / "sql"

@pytest.fixture
def databases(tmp_path, monkeypatch):
    monkeypatch.setenv('ANALYTICS_TEST_MODE', '1')
    dsn = os.environ['ANALYTICS_SOURCE_DSN']
    connection = psycopg.connect(dsn, autocommit=True)
    assert connection.info.dbname == 'analytics_fixture'
    assert connection.info.host in ('localhost', '127.0.0.1', 'postgres')
    config = {**clickhouse_config(), 'event_schema': 'legacy'}
    assert config['url'] in ('http://127.0.0.1:58123', 'http://clickhouse:8123')
    connection.execute('DROP SCHEMA IF EXISTS analytics_export CASCADE; DROP TABLE IF EXISTS public.raw')
    connection.execute('''CREATE TABLE public.raw (
        id bigint UNIQUE, environment text NOT NULL DEFAULT 'production',
        event_type text NOT NULL DEFAULT 'timerEvent',
        timestamp timestamp NOT NULL DEFAULT '2026-10-01 00:00:00', event jsonb NOT NULL DEFAULT '{}')''')
    connection.execute((SQL / '001_capture.sql').read_text())
    ch(config, 'DROP DATABASE IF EXISTS analytics SYNC')
    initialize(config)
    yield connection, config, {'directory': tmp_path}, dsn
    connection.close()
