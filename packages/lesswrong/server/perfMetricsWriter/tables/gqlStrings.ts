import uniq from "lodash/uniq";
import LRU from 'lru-cache';
import md5 from "md5";
import InsertQuery from "@/server/sql/InsertQuery";
import SelectQuery from "@/server/sql/SelectQuery";
import Table from "@/server/sql/Table";
import { NotNullType, StringType } from "@/server/sql/Type";
import { filterNonnull } from "../../../lib/utils/typeGuardUtils";
import type { AnalyticsConnectionPool } from "../../analytics/postgresConnection";

interface PerfMetricGqlString {
  id: number;
  gql_hash: string;
  gql_string: string;
}

const perfMetricsGqlStringsTable = new Table('perf_metrics_gql_strings');
perfMetricsGqlStringsTable.addField('gql_hash', new NotNullType(new StringType()));
perfMetricsGqlStringsTable.addField('gql_string', new NotNullType(new StringType()));

const GQL_STRING_ID_CACHE = new LRU<string, number>({max: 10000});

function cacheQueryStringRecords(queryStringRecords: PerfMetricGqlString[]) {
  queryStringRecords.forEach(({ id, gql_string }) => {
    const gqlHash = md5(gql_string);
    GQL_STRING_ID_CACHE.set(gqlHash, id);
  });
}

export function getGqlStringIdFromCache(gqlString?: string): { gql_string_id: number | null } {
  if (!gqlString) return { gql_string_id: null };
  const gqlHash = md5(gqlString);
  return { gql_string_id: GQL_STRING_ID_CACHE.get(gqlHash) ?? null };
}

async function insertAndCacheGqlStringRecords(gqlStrings: string[], connection: AnalyticsConnectionPool) {
  const gqlRecords = gqlStrings.map((gql_string) => ({gql_hash: md5(gql_string), gql_string}));
  const previouslyCachedGqlStrings = gqlRecords.filter(({ gql_hash }) => GQL_STRING_ID_CACHE.has(gql_hash));
  const newGqlRecords = gqlRecords.filter(({ gql_hash }) => !GQL_STRING_ID_CACHE.has(gql_hash));

  if (newGqlRecords.length === 0) {
    return;
  }

  // Insert and cache all the new query strings we don't already have cached
  const { sql, args } = new InsertQuery(perfMetricsGqlStringsTable, newGqlRecords as AnyBecauseHard, undefined, { conflictStrategy: 'ignore', returnInserted: true }).compile();
  const insertedQueryStringRecords = await connection.any<PerfMetricGqlString>(sql, args);
  cacheQueryStringRecords(insertedQueryStringRecords);

  // The insert query has a RETURNING * but that doesn't return anything for the ON CONFLICT DO NOTHING cases, so we need to fetch those separately
  const insertedQueryStrings = insertedQueryStringRecords.map(record => record.gql_string);
  const cachedQueryStrings = new Set([...previouslyCachedGqlStrings, ...insertedQueryStrings]);
  const missingQueryStrings = gqlStrings.filter(queryString => !cachedQueryStrings.has(queryString));

  if (missingQueryStrings.length > 0) {
    const { sql, args } = new SelectQuery(perfMetricsGqlStringsTable, { gql_string: { $in: missingQueryStrings } }).compile();
    const remainingQueryStringRecords = await connection.any(sql, args);
    cacheQueryStringRecords(remainingQueryStringRecords);
  }
}

export async function insertAndCacheGqlStringsInBatch(batch: PerfMetric[], connection: AnalyticsConnectionPool) {
  const queryStringsInBatch = uniq(filterNonnull(batch.map(metric => metric.gql_string)));
  if (queryStringsInBatch.length > 0) {
    await insertAndCacheGqlStringRecords(queryStringsInBatch, connection);
  }
}
