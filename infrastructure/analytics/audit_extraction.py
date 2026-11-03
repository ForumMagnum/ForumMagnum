"""Read-only local-archive audit. Output contains schema counts, never values."""

import argparse
import json
import time
from collections import Counter
from pathlib import Path

from archive import decode_batch, get_object, inventory
from extraction import EXTRACTOR_FINGERPRINT, FIELDS, extract
from typed_pipeline import read_manifest


def audit(store, output, progress=None):
    started = time.monotonic()
    counts = {name: Counter() for name in ('present', 'null', 'invalid', 'out_of_scope', 'conflicts', 'normalized')}
    valid = Counter()
    layouts = Counter()
    events = Counter()
    invalid_events = Counter()
    rows = manifests = raw_bytes = projected_bytes = 0
    for key in inventory(store):
        manifest = read_manifest(store, key)
        for event in decode_batch(manifest, get_object(store, manifest['object_key']), prepare=extract):
            rows += 1
            raw_bytes += len(event['event_json'].encode())
            layouts[event['payload_layout']] += 1
            events[event['event_type']] += 1
            for name in counts:
                counts[name].update(event['property_' + name])
            valid.update(f['column'] for f in FIELDS if f['column'] in event)
            if event['property_invalid']:
                invalid_events[event['event_type']] += 1
            # Measure the actual sparse wire representation, not 132 nulls per row.
            projected_bytes += len(json.dumps(event, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode()) + 1
        manifests += 1
        if progress and manifests % 20 == 0:
            progress({'rows': rows, 'manifests': manifests, 'seconds': time.monotonic() - started})
    result = {'extractor_fingerprint': EXTRACTOR_FINGERPRINT, 'rows': rows, 'manifests': manifests,
              'seconds': time.monotonic() - started, 'raw_payload_bytes': raw_bytes,
              'projected_wire_bytes': projected_bytes, 'layouts': layouts,
              'event_counts': events, 'invalid_event_counts': invalid_events,
              'field_counts': {f['column']: {**{name: c[f['column']] for name, c in counts.items()},
                                             'valid': valid[f['column']]} for f in FIELDS}}
    output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
    return {key: result[key] for key in ('rows', 'manifests', 'seconds', 'layouts', 'projected_wire_bytes')}


def print_progress(value):
    print(json.dumps(value), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    print_progress(audit({'directory': args.archive}, args.output, print_progress))
