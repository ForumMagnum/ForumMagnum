"""Load the generated worker environment as data, never shell-source secrets."""
import json
import os
import sys
from pathlib import Path


def read_environment(path):
    values = {}
    for line in path.read_text().splitlines():
        if not line or line.startswith('#'):
            continue
        key, value = line.split('=', 1)
        if not key.replace('_', '').isalnum():
            raise ValueError('Invalid environment key')
        values[key] = json.loads(value) if value.startswith('"') else value
    return values


if __name__ == '__main__':
    os.environ.update(read_environment(Path('/etc/lw-analytics/worker.env')))
    os.execv(sys.executable, [sys.executable, str(Path(__file__).resolve().parents[1] / 'cli.py'), *sys.argv[1:]])
