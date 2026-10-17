"""Shared authenticated HTTP transport, with explicit connection-pool lifetime."""

import os
from contextlib import contextmanager, nullcontext
from urllib.parse import urlparse

import httpx


def clickhouse_config(role='ingest'):
    url = os.environ['ANALYTICS_CLICKHOUSE_URL']
    parsed = urlparse(url)
    test = os.environ.get('ANALYTICS_TEST_MODE') == '1'
    if parsed.scheme != 'https' and not (test and parsed.hostname in ('127.0.0.1', 'localhost', 'clickhouse')):
        raise ValueError('ClickHouse requires TLS')
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ValueError('Credentials/options must not be embedded in ClickHouse URL')
    prefix = f'ANALYTICS_CH_{role.upper()}'
    return {'url': url, 'user': os.environ[prefix + '_USER'],
            'password': os.environ[prefix + '_PASSWORD'], 'read_only': role == 'query',
            'event_schema': os.environ.get('ANALYTICS_EVENT_SCHEMA', 'legacy')}


def ch(config, sql, parameters=None, data=None, query_id=None, timeout=330, external=None):
    params = {'query': sql, 'wait_end_of_query': '1'}
    # readonly=1 rejects setting changes even when a value seems harmless.
    # The query profile supplies parsing/output settings; keep its HTTP requests
    # free of write settings such as async_insert.
    if not config.get('read_only'):
        params.update({'async_insert': '0', 'date_time_input_format': 'best_effort',
                       'function_json_value_return_type_allow_nullable': '1',
                       'output_format_json_quote_64bit_integers': '1'})
    if query_id:
        params['query_id'] = query_id
    for key, value in (parameters or {}).items():
        params[f'param_{key}'] = value
    files = None
    if external:
        if data is not None:
            raise ValueError('External tables and insert data are mutually exclusive')
        name, structure, body = external
        params[name + '_structure'] = structure
        params[name + '_format'] = 'JSONEachRow'
        files = {name: ('data.jsonl', body, 'application/octet-stream')}
    owned = config.get('_client')
    manager = nullcontext(owned) if owned is not None else httpx.Client(
        timeout=httpx.Timeout(timeout, connect=10), follow_redirects=False)
    with manager as client:
        if 'statistics' in config:
            config['statistics']['requests'] = config['statistics'].get('requests', 0) + 1
        response = client.post(config['url'], params=params,
                               content=None if files else (data or b''), files=files,
                               timeout=httpx.Timeout(timeout, connect=10),
                               auth=(config['user'], config['password']))
        if response.status_code != 200:
            # Server errors can contain payloads, SQL, and URLs. Don't log them.
            raise RuntimeError(f'ClickHouse request failed (HTTP {response.status_code})')
        return response.text


@contextmanager
def clickhouse_session(config):
    if '_client' in config:
        yield config
    else:
        with httpx.Client(follow_redirects=False) as client:
            yield {**config, '_client': client}
