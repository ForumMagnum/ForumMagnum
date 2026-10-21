import asyncio
import time

import pytest

from control import admit, begin_drain, new_state, should_start, watchdog_flags


def test_queries_queue_and_block_drain():
    asyncio.run(query_race())


async def query_race():
    state = new_state()
    state['phase'] = 'ready'
    state['last_activity'] = time.monotonic() - 1000
    async with admit(state, 'one'):
        assert not begin_drain(state, 0)
        second = asyncio.create_task(queued(state))
        await asyncio.sleep(0)
        assert state['pending'] == 2
        assert state['active'] == {'one'}
    await second
    assert state['pending'] == 0
    assert begin_drain(state, 0)
    with pytest.raises(RuntimeError, match='starting_or_draining'):
        async with admit(state, 'three'):
            pass


async def queued(state):
    async with admit(state, 'two'):
        assert state['active'] == {'two'}


def test_duplicate_ids_are_rejected_while_queued_and_reservations_release():
    asyncio.run(duplicate_race())


async def duplicate_race():
    state = new_state()
    state['phase'] = 'ready'
    async with admit(state, 'one'):
        second = asyncio.create_task(queued(state))
        await asyncio.sleep(0)
        with pytest.raises(RuntimeError, match='duplicate_query_id'):
            async with admit(state, 'two'):
                pass
    await second
    assert not state['reserved']


def test_wake_during_shutdown_survives_until_stopped():
    assert not should_start('stopping', 1000, 100)
    assert should_start('stopped', 1000, 110)
    assert not should_start('stopped', 1000, 1001)


def test_watchdog_runs_without_host():
    flags = watchdog_flags({}, 200000)
    assert flags == ['stale_ingestion', 'overdue_backup']
