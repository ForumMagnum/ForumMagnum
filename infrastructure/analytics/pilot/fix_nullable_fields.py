"""One-time repair for this pilot's derived columns; raw payloads stay intact."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pipeline import ch, clickhouse_config
from pilot.verify import fingerprint, identity_guard


def main():
    identity_guard()
    config = clickhouse_config('maintenance')
    before = fingerprint(config)
    fields = [('user_id', 'userId'), ('client_id', 'clientId'), ('tab_id', 'tabId'), ('session_id', 'sessionId')]
    for column, key in fields:
        ch(config, f"ALTER TABLE analytics.raw_events MODIFY COLUMN {column} Nullable(String) MATERIALIZED JSONExtract(event_json, '{key}', 'Nullable(String)')")
    mutations = ', '.join('MATERIALIZE COLUMN ' + column for column, _ in fields)
    ch(config, f'ALTER TABLE analytics.raw_events {mutations} SETTINGS mutations_sync=2')
    assert fingerprint(config) == before
    print('Derived fields repaired; raw row count and content fingerprint unchanged.')


if __name__ == '__main__':
    main()
