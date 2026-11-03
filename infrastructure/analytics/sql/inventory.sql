-- One server/replica only: never clusterAllReplicas() or sum replica totals.
SELECT database, table, sum(rows) AS physical_rows,
       sum(data_compressed_bytes) AS compressed_bytes,
       sum(data_uncompressed_bytes) AS uncompressed_bytes,
       sum(bytes_on_disk) AS bytes_on_disk
FROM system.parts WHERE active AND database NOT IN ('system', 'INFORMATION_SCHEMA', 'information_schema')
GROUP BY database, table ORDER BY bytes_on_disk DESC;
