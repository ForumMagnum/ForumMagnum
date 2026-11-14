import argparse
import json
from pathlib import Path

from archive import publish, store_config
from operations import backup, restore
from pipeline import (ch, clickhouse_config, cycle, export_snapshot, initialize,
                      read_pending, replay, source_connection, source_lease, worker_lock)


def main():
    parser = argparse.ArgumentParser(description='LessWrong archived analytics operator commands')
    parser.add_argument('--event-schema', choices=('legacy', 'typed-v1'),
                        help='Explicit destination; defaults to ANALYTICS_EVENT_SCHEMA or legacy')
    commands = parser.add_subparsers(dest='command', required=True)
    for name in ('init', 'cycle', 'export', 'replay', 'inventory'):
        commands.add_parser(name)
    snapshot = commands.add_parser('backfill')
    snapshot.add_argument('--source-name', required=True)
    snapshot.add_argument('--resume-after')
    snapshot.add_argument('--max-batches', type=int)
    backups = commands.add_parser('backup')
    backups.add_argument('name')
    backups.add_argument('--base')
    restores = commands.add_parser('restore')
    restores.add_argument('name')
    args = parser.parse_args()
    config = clickhouse_config('maintenance' if args.command in ('init', 'backup', 'restore') else 'ingest')
    if args.event_schema:
        config['event_schema'] = args.event_schema
    with worker_lock():
        if args.command == 'init':
            initialize(config)
            result = {'initialized': True}
        elif args.command == 'inventory':
            print(ch(config, (Path(__file__).parent / 'sql/inventory.sql').read_text().rstrip().rstrip(';') + ' FORMAT JSON'))
            return
        elif args.command == 'replay':
            result = replay(store_config(), config)
        elif args.command == 'backup':
            result = backup(store_config(), config, args.name, args.base)
        elif args.command == 'restore':
            result = restore(store_config(), config, args.name)
        else:
            with source_connection() as connection:
                if args.command == 'cycle':
                    result = cycle(connection, store_config(), config)
                elif args.command == 'export':
                    with source_lease(connection):
                        events = read_pending(connection)
                        result = {'published': publish(store_config(), events)[0] if events else None}
                else:
                    result = export_snapshot(connection, store_config(), args.source_name,
                                             args.resume_after, args.max_batches)
        print(json.dumps(result))


if __name__ == '__main__':
    main()
