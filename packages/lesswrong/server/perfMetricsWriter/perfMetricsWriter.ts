import { AnalyticsConnectionPool, pgPromiseLib } from "../analytics/postgresConnection";
import { getGqlStringIdFromCache, insertAndCacheGqlStringsInBatch } from "./tables/gqlStrings";
import { getSqlStringIdFromCache, insertAndCacheSqlStringsInBatch } from "./tables/sqlStrings";

export const perfMetricsColumnSet = new pgPromiseLib.helpers.ColumnSet(['trace_id', 'op_type', 'op_name', 'started_at', 'ended_at', 'parent_trace_id', 'client_path', 'extra_data', 'gql_string_id', 'sql_string_id', 'ip', 'user_agent', 'user_id', 'queue_priority', 'render_started_at', 'environment'], {table: 'perf_metrics'});

export function insertAndCacheNormalizedDataInBatch(batch: PerfMetric[], connection: AnalyticsConnectionPool) {
  return Promise.all([
    insertAndCacheGqlStringsInBatch(batch, connection),
    insertAndCacheSqlStringsInBatch(batch, connection)
  ]);
}

export function constructPerfMetricBatchInsertQuery(batch: PerfMetric[], environment: string) {
  return batch.map(perfMetric => {
    const { gql_string, sql_string, ...rest } = perfMetric;
    const gqlStringId = getGqlStringIdFromCache(gql_string);
    const sqlStringId = getSqlStringIdFromCache(sql_string);

    return {
      ...rest,
      environment,
      parent_trace_id: perfMetric.parent_trace_id ?? null,
      client_path: perfMetric.client_path ?? null,
      extra_data: perfMetric.extra_data ?? null,
      ip: perfMetric.ip ?? null,
      user_agent: perfMetric.user_agent ?? null,
      user_id: perfMetric.user_id ?? null,
      render_started_at: perfMetric.render_started_at ?? null,
      queue_priority: perfMetric.queue_priority ?? null,
      ...gqlStringId,
      ...sqlStringId
    };
  });
}
