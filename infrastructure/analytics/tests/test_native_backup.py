import json
import os
from uuid import uuid4

import pytest

from archive import publish
from pipeline import ch, read_pending, replay
from test_integration import logical_count

pytestmark = pytest.mark.skipif(os.environ.get('ANALYTICS_NATIVE_BACKUP') != '1', reason='Requires local backup disk')


def test_full_incremental_restore_then_archive_and_pending(databases):
    connection, config, store, _ = databases
    name = 'fixture-' + uuid4().hex
    connection.execute('INSERT INTO raw (id) VALUES (1)')
    publish(store, read_pending(connection))
    replay(store, config)
    first = json.loads(ch(config, f"BACKUP DATABASE analytics TO Disk('backups','{name}') FORMAT JSONEachRow"))
    assert first['status'] == 'BACKUP_CREATED'
    connection.execute('INSERT INTO raw (id) VALUES (2)')
    publish(store, read_pending(connection))
    replay(store, config)
    increment = json.loads(ch(config, f"BACKUP DATABASE analytics TO Disk('backups','{name}-inc') SETTINGS base_backup = Disk('backups','{name}') FORMAT JSONEachRow"))
    assert increment['status'] == 'BACKUP_CREATED'
    connection.execute('INSERT INTO raw (id) VALUES (3)')
    publish(store, read_pending(connection))
    connection.execute('INSERT INTO raw (id) VALUES (4)')
    ch(config, 'DROP DATABASE analytics SYNC')
    restored = json.loads(ch(config, f"RESTORE DATABASE analytics FROM Disk('backups','{name}-inc') FORMAT JSONEachRow"))
    assert restored['status'] == 'RESTORED'
    ch(config, 'TRUNCATE TABLE analytics.applied_batches')
    assert logical_count(config) == 2
    replay(store, config)
    assert logical_count(config) == 3
    publish(store, read_pending(connection))
    replay(store, config)
    assert logical_count(config) == 4
