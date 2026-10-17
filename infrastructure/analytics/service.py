"""Private TLS query gateway, daily worker, and graceful idle controller.

Run exactly one uvicorn process. All work goes through the admission gate;
operator CLI jobs must stop this service first (see runbook).
"""

import asyncio
import hmac
import json
import os
import re
import shutil
import subprocess
import time
from contextlib import asynccontextmanager
from uuid import UUID, uuid4

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import Response

from archive import store_config
from cloud_control import publish_status, read_state, state_table
from control import admit, begin_drain, new_state
from operations import backup
from pipeline import ch, clickhouse_config, cycle, events_view, replay, source_connection, worker_lock

state = new_state()


def authenticate(request):
    expected = os.environ['ANALYTICS_GATEWAY_TOKEN']
    if len(expected) < 32 or not hmac.compare_digest(request.headers.get('authorization', ''), 'Bearer ' + expected):
        raise HTTPException(401, 'Unauthorized')


def run_cycle():
    with worker_lock(), source_connection() as connection:
        replay(store_config(), clickhouse_config())
        result = cycle(connection, store_config(), clickhouse_config())
        oldest = connection.execute('''SELECT EXTRACT(EPOCH FROM clock_timestamp() - received_at)::bigint
            FROM analytics_export.pending ORDER BY received_at LIMIT 1''').fetchone()
        fields = {'queue_oldest_seconds': oldest[0] if oldest else 0}
        if result['complete']:
            fields['cycle_completed_at'] = int(time.time())
            fields['failure'] = ''
        publish_status(fields)
        return result


def run_backup():
    with worker_lock():
        # Full daily initially. Incremental backups are available explicitly via CLI.
        backup(store_config(), clickhouse_config('maintenance'), f'full-{int(time.time())}')
        publish_status({'backup_completed_at': int(time.time()), 'failure': ''})


def stop_host():
    # systemd permits only this fixed command via sudo. It gracefully stops
    # ClickHouse before system shutdown; EC2 shutdown behavior is configured stop.
    subprocess.run(['sudo', '-n', '/usr/local/sbin/lw-analytics-stop'], check=True, timeout=360)


async def maintain():
    while True:
        try:
            remote = await asyncio.to_thread(read_state, state_table())
            if state['phase'] == 'starting':
                config = clickhouse_config()
                await asyncio.to_thread(ch, config, f'SELECT 1 FROM {events_view(config)} LIMIT 0')
                state['phase'] = 'ready'
                state['last_activity'] = time.monotonic()
            if state['phase'] == 'ready':
                needs_import = int(remote.get('import_requested_at', 0)) > int(remote.get('cycle_completed_at', 0))
                if needs_import:
                    async with admit(state, 'import', queue_timeout=330):
                        await asyncio.to_thread(run_cycle)
                if int(time.time()) - int(remote.get('backup_completed_at', 0)) > 86400:
                    async with admit(state, 'backup', queue_timeout=330):
                        await asyncio.to_thread(run_backup)
                # A wake during draining is kept in DynamoDB. The external
                # watchdog starts the host again once EC2 reaches stopped.
                remote = await asyncio.to_thread(read_state, state_table())
                if int(remote.get('desired_until', 0)) < int(time.time()) and begin_drain(state, 300):
                    await asyncio.to_thread(publish_status, {'phase': 'draining'})
                    with worker_lock():
                        await asyncio.to_thread(stop_host)
                    return
        except asyncio.CancelledError:
            raise
        except Exception as error:
            if state['phase'] == 'draining':
                # ClickHouse might already be stopped. Require operator recovery;
                # never reopen query admission on an indeterminate shutdown.
                state['phase'] = 'failed'
            # No payloads/credentials in CloudWatch or state records.
            await asyncio.to_thread(publish_status, {'failure': type(error).__name__, 'heartbeat_at': int(time.time())})
        await asyncio.sleep(30)


async def heartbeat():
    # Imports/backups can take hours. Their duration must not make a healthy
    # gateway appear unreachable to the external controller.
    while True:
        try:
            disk = shutil.disk_usage(os.environ.get('ANALYTICS_DATA_DIR', '/var/lib/clickhouse'))
            await asyncio.to_thread(publish_status, {'heartbeat_at': int(time.time()), 'phase': state['phase'],
                                                   'disk_free_bytes': disk.free})
        except Exception:
            # The watchdog detects absent heartbeats; do not expose credentials.
            pass
        await asyncio.sleep(30)


@asynccontextmanager
async def lifespan(app):
    task = asyncio.create_task(maintain())
    heartbeat_task = asyncio.create_task(heartbeat())
    try:
        yield
    finally:
        state['phase'] = 'draining'
        while state['pending']:
            await asyncio.sleep(0.5)
        task.cancel()
        heartbeat_task.cancel()
        await asyncio.gather(task, heartbeat_task, return_exceptions=True)


app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)


@app.get('/status')
async def status(request: Request):
    authenticate(request)
    return {'state': state['phase'], 'queued_or_active': state['pending']}


async def cancel_query(query_id):
    # Maintenance role has KILL QUERY; read-only query users cannot cancel
    # imports, backups, or another database's queries directly.
    await asyncio.to_thread(ch, clickhouse_config('maintenance'),
                            'KILL QUERY WHERE query_id = {id:String} SYNC', {'id': query_id})


async def execute_query(sql, query_id):
    config = clickhouse_config('query')
    async with httpx.AsyncClient(timeout=httpx.Timeout(130, connect=10), follow_redirects=False) as client:
        async with client.stream('POST', config['url'], auth=(config['user'], config['password']),
                                 params={'query_id': query_id, 'wait_end_of_query': '1', 'default_format': 'JSON'},
                                 content=sql.encode()) as result:
            if result.status_code != 200:
                raise HTTPException(400, 'Query rejected by ClickHouse')
            body = bytearray()
            async for chunk in result.aiter_bytes():
                body.extend(chunk)
                if len(body) > 8 * 1024 * 1024:
                    raise HTTPException(413, 'Result exceeds 8 MiB; narrow the query')
            return bytes(body)


@app.post('/query')
async def query(request: Request):
    authenticate(request)
    body = await bounded_body(request)
    try:
        payload = json.loads(body)
        sql = payload['sql']
        query_id = str(UUID(payload.get('query_id', str(uuid4()))))
    except (ValueError, TypeError, KeyError):
        raise HTTPException(400, 'Expected sql and optional UUID query_id') from None
    if not isinstance(sql, str) or not re.match(r'^\s*(SELECT|WITH)\b', sql, re.IGNORECASE):
        raise HTTPException(400, 'Expected a read-only SELECT or WITH query')
    # SQL syntax filtering is only ergonomics. ClickHouse grants and immutable
    # read-only/resource settings enforce the actual security boundary.
    if query_id in state['reserved']:
        raise HTTPException(409, 'Query ID already queued or active')
    try:
        async with admit(state, query_id):
            task = asyncio.create_task(execute_query(sql, query_id))
            try:
                while not task.done():
                    await asyncio.wait({task}, timeout=0.5)
                    if await request.is_disconnected():
                        raise HTTPException(499, 'Client disconnected')
                result = await task
            except BaseException:
                task.cancel()
                await asyncio.gather(task, return_exceptions=True)
                # Keep admission active until cancellation reaches ClickHouse.
                await asyncio.shield(cancel_query(query_id))
                raise
    except (RuntimeError, TimeoutError):
        raise HTTPException(503, 'Starting, draining, or query queue full; retry', headers={'Retry-After': '5'}) from None
    return Response(result, media_type='application/json', headers={'X-Query-ID': query_id, 'Cache-Control': 'no-store'})


@app.post('/cancel/{query_id}')
async def cancel(query_id: str, request: Request):
    authenticate(request)
    try:
        query_id = str(UUID(query_id))
    except ValueError:
        raise HTTPException(400, 'Invalid query ID') from None
    if query_id not in state['active']:
        raise HTTPException(404, 'No active query with that ID')
    await cancel_query(query_id)
    return {'cancelled': query_id}


async def bounded_body(request):
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > 65536:
            raise HTTPException(413, 'Query request exceeds 64 KiB')
    return bytes(body)
