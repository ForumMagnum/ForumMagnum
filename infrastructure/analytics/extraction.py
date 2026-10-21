"""Versioned projections of immutable JSON. Every lossy decision is observable.

Missing, explicit null, invalid and out-of-scope properties remain distinct. The
original event_json is always retained; this module never invents identities or
joins events. Increment EXTRACTOR_VERSION and use a new destination when changing
the extraction contract after a version has been loaded.
"""

import hashlib
import json
import math
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

from archive import json_bytes

DIRECTORY = Path(__file__).parent
REGISTRY_BYTES = (DIRECTORY / 'event_schema.json').read_bytes()
REGISTRY = json.loads(REGISTRY_BYTES)
EXTRACTOR_VERSION = REGISTRY['version']
FIELDS = REGISTRY['fields']
EXTRACTOR_FINGERPRINT = hashlib.sha256(
    REGISTRY_BYTES + Path(__file__).read_bytes() + (DIRECTORY / 'typed_schema.py').read_bytes()).hexdigest()
MISSING = object()

SQL_TYPES = {
    'string': 'Nullable(String)', 'destination': 'Nullable(String)',
    'integer': 'Nullable(Int64)', 'number': 'Nullable(Float64)',
    'boolean': 'Nullable(Bool)', 'datetime': "Nullable(DateTime64(6, 'UTC'))",
    'strings': 'Array(String)', 'numbers': 'Array(Float64)',
    'string_map': 'Map(String, String)', 'boolean_map': 'Map(String, Bool)',
    'post_mounts': 'Array(Tuple(post_id String, base_score Nullable(Int64), score Nullable(Float64)))',
    'post_scenarios': 'Array(Tuple(post_id String, scenario String, generated_at Nullable(String)))',
}


def compile_paths(fields):
    tree = {}
    for field in fields:
        if field['kind'] not in SQL_TYPES:
            raise ValueError('Unknown extraction kind')
        for priority, path in enumerate([field['path'], *field.get('aliases', [])]):
            branch = tree
            for segment in path.split('.'):
                branch = branch.setdefault(segment, {})
            branch.setdefault(None, []).append((field, priority, path))
    return tree


PATHS = compile_paths(FIELDS)


def find_fields(value, tree, found, prefix, root_priority):
    if not isinstance(value, dict):
        return
    for key, child in value.items():
        branch = tree.get(key)
        if branch is None:
            continue
        for field, priority, path in branch.get(None, []):
            found.setdefault(field['column'], []).append(
                (root_priority, priority, prefix + path, child, field))
        find_fields(child, branch, found, prefix, root_priority)


def integer(value):
    # bool is an int subclass. Numeric strings and fractional numbers are not
    # silently accepted, even if an upstream scanner supplied a plausible value.
    if type(value) is not int or not -(2**63) <= value < 2**63:
        raise ValueError('Expected Int64')
    return value


def number(value):
    if isinstance(value, bool) or not isinstance(value, (int, float, Decimal)):
        raise ValueError('Expected number')
    result = float(value)
    if not math.isfinite(result):
        raise ValueError('Expected finite number')
    return result


def string(value):
    if not isinstance(value, str):
        raise ValueError('Expected string')
    return value


def boolean(value):
    if type(value) is not bool:
        raise ValueError('Expected boolean')
    return value


def timestamp(value):
    # timeToCapture was also numeric historically. Its units are unproven, so
    # do not manufacture a timestamp from a guessed epoch or elapsed duration.
    if not isinstance(value, str):
        raise ValueError('Expected ISO timestamp')
    parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if parsed.tzinfo is None or not 1900 <= parsed.year < 2300:
        raise ValueError('Expected bounded timestamp with timezone')
    return parsed.astimezone(timezone.utc).isoformat(sep=' ', timespec='microseconds')[:-6]


def destination(value):
    if isinstance(value, str):
        return value
    if not isinstance(value, dict) or 'pathname' not in value:
        raise ValueError('Expected destination string or location object')
    # Unknown location attributes may affect its meaning. Keep the raw object
    # and flag it instead of discarding attributes while claiming normalization.
    if set(value) - {'pathname', 'search', 'hash'}:
        raise ValueError('Unrecognized location shape')
    path = string(value['pathname'])
    search = string(value.get('search', ''))
    fragment = string(value.get('hash', ''))
    if (search and not search.startswith('?')) or (fragment and not fragment.startswith('#')):
        raise ValueError('Invalid location suffix')
    return path + search + fragment


def optional(value, convert):
    return None if value is None else convert(value)


def convert_value(kind, value):
    if kind == 'string':
        return string(value)
    if kind == 'integer':
        return integer(value)
    if kind == 'number':
        return number(value)
    if kind == 'boolean':
        return boolean(value)
    if kind == 'datetime':
        return timestamp(value)
    if kind == 'destination':
        return destination(value)
    if kind in ('strings', 'numbers', 'post_mounts', 'post_scenarios'):
        if kind == 'numbers' and isinstance(value, (int, float, Decimal)) and not isinstance(value, bool):
            return [number(value)]
        if not isinstance(value, list):
            raise ValueError('Expected array')
        if kind == 'strings':
            return [string(item) for item in value]
        if kind == 'numbers':
            return [number(item) for item in value]
        result = []
        for item in value:
            if not isinstance(item, dict):
                raise ValueError('Expected array of objects')
            if kind == 'post_mounts':
                if set(item) - {'postId', 'baseScore', 'score'}:
                    raise ValueError('Unrecognized mount record')
                result.append({'post_id': string(item['postId']),
                               'base_score': optional(item.get('baseScore'), integer),
                               'score': optional(item.get('score'), number)})
            else:
                if set(item) - {'postId', 'scenario', 'generatedAt'}:
                    raise ValueError('Unrecognized scenario record')
                result.append({'post_id': string(item['postId']), 'scenario': string(item['scenario']),
                               'generated_at': optional(item.get('generatedAt'), string)})
        return result
    if kind in ('string_map', 'boolean_map'):
        if not isinstance(value, dict):
            raise ValueError('Expected object')
        convert = string if kind == 'string_map' else boolean
        return {key: convert(item) for key, item in value.items()}
    raise ValueError('Unrecognized field kind')


def extract(event, payload):
    projected = {'extractor_version': EXTRACTOR_VERSION,
                 'extractor_fingerprint': EXTRACTOR_FINGERPRINT,
                 'payload_layout': 'object' if isinstance(payload, dict) else 'non_object',
                 'property_present': [], 'property_null': [], 'property_invalid': [],
                 'property_out_of_scope': [], 'property_conflicts': [],
                 'property_normalized': [], 'property_sources': {}}
    found = {}
    find_fields(payload, PATHS, found, '', 0)
    # A documented 2019 layout, not an unconditional flatten of any `props`
    # object (other events carry content snapshots in a property with that name).
    if (isinstance(payload, dict) and payload.get('type') == event['event_type']
            and isinstance(payload.get('props'), dict)
            and isinstance(payload['props'].get('eventProps'), dict)):
        projected['payload_layout'] = 'legacy_event_props'
        find_fields(payload['props'], PATHS, found, 'props.', 1)
        find_fields(payload['props']['eventProps'], PATHS, found, 'props.eventProps.', 2)
    for column, candidates in found.items():
        candidates.sort(key=lambda candidate: candidate[:2])
        _, _, source, value, field = candidates[0]
        projected['property_present'].append(column)
        if source != field['path']:
            projected['property_sources'][column] = source
        # A preferred explicit null must not be replaced by a fallback value.
        if any(type(value) is not type(other[3]) or value != other[3] for other in candidates[1:]):
            projected['property_conflicts'].append(column)
        if value is None:
            projected['property_null'].append(column)
        if field.get('events') and event['event_type'] not in field['events']:
            projected['property_out_of_scope'].append(column)
            continue
        if value is None:
            continue
        try:
            converted = convert_value(field['kind'], value)
        except (ValueError, TypeError, KeyError, OverflowError):
            projected['property_invalid'].append(column)
            continue
        projected[column] = converted
        if ((field['kind'] == 'destination' and isinstance(value, dict))
                or (field['kind'] == 'numbers' and not isinstance(value, list))
                or field['kind'] == 'datetime'):
            projected['property_normalized'].append(column)
    # Deterministic across retries even if source object ordering differs.
    for key, value in projected.items():
        if key.startswith('property_') and isinstance(value, list):
            value.sort()
    projected['properties_hash'] = hashlib.sha256(json_bytes(projected)).hexdigest()
    return {**event, **projected}
