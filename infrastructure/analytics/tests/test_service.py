import asyncio
import json

from fastapi.testclient import TestClient

import cloud_control
import service
from control import admit, new_state


def test_heartbeat_remains_live_while_a_job_holds_admission(monkeypatch):
    asyncio.run(heartbeat_during_job(monkeypatch))


async def heartbeat_during_job(monkeypatch):
    state = new_state()
    state['phase'] = 'ready'
    monkeypatch.setattr(service, 'state', state)
    monkeypatch.setenv('ANALYTICS_DATA_DIR', '/tmp')
    published = []
    monkeypatch.setattr(service, 'publish_status', published.append)
    async with admit(state, 'backup'):
        task = asyncio.create_task(service.heartbeat())
        try:
            async with asyncio.timeout(2):
                while not published:
                    await asyncio.sleep(0.01)
            assert published[0]['phase'] == 'ready'
            assert published[0]['heartbeat_at'] > 0
            assert state['pending'] == 1
        finally:
            task.cancel()
            await asyncio.gather(task, return_exceptions=True)


def test_gateway_requires_authentication_before_accepting_sql(monkeypatch):
    monkeypatch.setenv('ANALYTICS_GATEWAY_TOKEN', 'a' * 32)
    client = TestClient(service.app)
    assert client.get('/status').status_code == 401
    assert client.post('/query', json={'sql': 'SELECT 1'}).status_code == 401
    assert client.post('/cancel/00000000-0000-4000-8000-000000000001').status_code == 401


def test_gateway_rejects_writes_and_queries_while_starting(monkeypatch):
    monkeypatch.setenv('ANALYTICS_GATEWAY_TOKEN', 'a' * 32)
    monkeypatch.setattr(service, 'state', new_state())
    client = TestClient(service.app, headers={'Authorization': 'Bearer ' + 'a' * 32})
    assert client.post('/query', json={'sql': 'INSERT INTO t VALUES (1)'}).status_code == 400
    assert client.post('/query', json={'sql': 'SELECT 1'}).status_code == 503
    assert client.post('/query', json={'sql': 'SELECT 1', 'query_id': 'bad'}).status_code == 400
    assert client.post('/query', content='x' * 65537).status_code == 413


def test_lambda_auth_rejection_cannot_start_compute(monkeypatch):
    class Secret:
        def get_secret_value(self, **kwargs):
            return {'SecretString': 'a' * 32}

    def client(name):
        assert name == 'secretsmanager', 'Unauthenticated request reached a side-effect client'
        return Secret()

    monkeypatch.setenv('ANALYTICS_CONTROL_SECRET_ARN', 'test')
    monkeypatch.setattr(cloud_control.boto3, 'client', client)
    result = cloud_control.handler({'requestContext': {'http': {'method': 'POST'}}, 'rawPath': '/wake'}, None)
    assert result['statusCode'] == 401
    assert json.loads(result['body']) == {'error': 'Unauthorized'}
