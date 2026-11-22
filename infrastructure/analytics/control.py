"""Small, independently testable admission and draining state machine."""

import asyncio
import time
from contextlib import asynccontextmanager


def new_state():
    return {'phase': 'starting', 'pending': 0, 'active': set(), 'reserved': set(),
            'last_activity': time.monotonic(), 'query_slot': asyncio.Semaphore(1)}


@asynccontextmanager
async def admit(state, query_id, queue_timeout=30):
    # All transitions run on one event loop, with no await between check/change.
    # Run uvicorn with ONE worker; multiple processes would require distributed admission.
    if state['phase'] != 'ready':
        raise RuntimeError('starting_or_draining')
    if state['pending'] >= 10:
        raise RuntimeError('queue_full')
    if query_id in state['reserved']:
        raise RuntimeError('duplicate_query_id')
    state['reserved'].add(query_id)
    state['pending'] += 1
    acquired = False
    try:
        await asyncio.wait_for(state['query_slot'].acquire(), queue_timeout)
        acquired = True
        state['active'].add(query_id)
        yield
    finally:
        state['pending'] -= 1
        state['active'].discard(query_id)
        state['reserved'].discard(query_id)
        state['last_activity'] = time.monotonic()
        if acquired:
            state['query_slot'].release()


def begin_drain(state, idle_seconds):
    if state['phase'] != 'ready' or state['pending'] or time.monotonic() - state['last_activity'] < idle_seconds:
        return False
    state['phase'] = 'draining'
    return True


def should_start(instance_state, desired_until, now):
    # A wake during stopping persists until a later watchdog tick sees stopped.
    return instance_state == 'stopped' and desired_until > now


def watchdog_flags(item, now):
    flags = []
    if now - int(item.get('cycle_completed_at', 0)) > 36 * 3600:
        flags.append('stale_ingestion')
    if now - int(item.get('backup_completed_at', 0)) > 48 * 3600:
        flags.append('overdue_backup')
    if item.get('failure'):
        flags.append('worker_failure')
    if int(item.get('queue_oldest_seconds', 0)) > 36 * 3600:
        flags.append('queue_growth')
    if int(item.get('disk_free_bytes', 2**63)) < 100 * 1024**3:
        flags.append('low_destination_disk')
    return flags
