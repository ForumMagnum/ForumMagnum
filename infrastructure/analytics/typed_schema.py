"""Generate a versioned destination; never ALTER or replace the pilot table."""

from extraction import EXTRACTOR_VERSION, FIELDS, SQL_TYPES

RAW_TABLE = f'analytics.raw_events_typed_v{EXTRACTOR_VERSION}'
EVENTS_VIEW = f'analytics.events_typed_v{EXTRACTOR_VERSION}'
RECEIPTS_TABLE = f'analytics.applied_batches_typed_v{EXTRACTOR_VERSION}'

# Useful intervals rather than treating browser epoch timestamps as durations.
DURATIONS = {
    'page_ttfb_ms': ('browser_request_start', 'browser_response_start'),
    'page_response_download_ms': ('browser_response_start', 'browser_response_end'),
    'page_dom_interactive_ms': ('browser_navigation_start', 'browser_dom_interactive'),
    'page_dom_content_loaded_ms': ('browser_navigation_start', 'browser_dom_content_loaded_event_end'),
    'page_load_ms': ('browser_navigation_start', 'browser_load_event_end'),
    'page_dns_ms': ('browser_domain_lookup_start', 'browser_domain_lookup_end'),
    'page_connect_ms': ('browser_connect_start', 'browser_connect_end'),
    'page_tls_ms': ('browser_secure_connection_start', 'browser_connect_end'),
}


def schema_sql():
    columns = [
        'schema_version UInt16', 'event_id String', 'source_id Nullable(Int64)',
        "event_time DateTime64(6, 'UTC')", "received_at Nullable(DateTime64(6, 'UTC'))",
        'environment LowCardinality(String)', 'event_type LowCardinality(String)',
        'event_json String CODEC(ZSTD(3))', 'content_hash FixedString(64) CODEC(ZSTD(3))',
        'extractor_version UInt32', 'extractor_fingerprint FixedString(64)',
        'properties_hash FixedString(64) CODEC(ZSTD(3))', 'payload_layout LowCardinality(String)',
        'property_present Array(LowCardinality(String))',
        'property_null Array(LowCardinality(String))',
        'property_invalid Array(LowCardinality(String))',
        'property_out_of_scope Array(LowCardinality(String))',
        'property_conflicts Array(LowCardinality(String))',
        'property_normalized Array(LowCardinality(String))',
        'property_sources Map(String, String)',
    ]
    for field in FIELDS:
        columns.append(f"{field['column']} {SQL_TYPES[field['kind']]}")
    for name, (start, end) in DURATIONS.items():
        columns.append(f"{name} Nullable(Int64) MATERIALIZED "
                       f"if(event_type = 'pageLoadFinished' AND {start} > 0 "
                       f"AND {end} >= {start}, {end} - {start}, NULL)")
    joined = ',\n  '.join(columns)
    selected = ', '.join(column.split()[0] for column in columns)
    return f"""CREATE DATABASE IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS {RAW_TABLE} (
  {joined}
)
ENGINE = ReplacingMergeTree
PARTITION BY cityHash64(event_id) % 16
ORDER BY event_id
SETTINGS fsync_after_insert = 1, fsync_part_directory = 1;

CREATE VIEW IF NOT EXISTS {EVENTS_VIEW} SQL SECURITY DEFINER AS
SELECT {selected} FROM {RAW_TABLE} FINAL;

CREATE TABLE IF NOT EXISTS {RECEIPTS_TABLE} (
  object_key String, checksum FixedString(64), row_count UInt64,
  extractor_fingerprint FixedString(64),
  applied_at DateTime64(6, 'UTC') DEFAULT now64(6)
) ENGINE = ReplacingMergeTree(applied_at) ORDER BY object_key
SETTINGS fsync_after_insert = 1, fsync_part_directory = 1;
"""


if __name__ == '__main__':
    print(schema_sql(), end='')
