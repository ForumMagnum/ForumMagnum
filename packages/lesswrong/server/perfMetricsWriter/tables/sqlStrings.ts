import uniq from "lodash/uniq";
import LRU from 'lru-cache';
import md5 from "md5";
import InsertQuery from "@/server/sql/InsertQuery";
import SelectQuery from "@/server/sql/SelectQuery";
import Table from "@/server/sql/Table";
import { NotNullType, StringType } from "@/server/sql/Type";
import { filterNonnull } from "../../../lib/utils/typeGuardUtils";
import type { AnalyticsConnectionPool } from "../../analytics/postgresConnection";

interface PerfMetricSqlString {
  id: number;
  sql_hash: string;
  sql_string: string;
}

const perfMetricsSqlStringsTable = new Table('perf_metrics_sql_strings');
perfMetricsSqlStringsTable.addField('sql_hash', new NotNullType(new StringType()));
perfMetricsSqlStringsTable.addField('sql_string', new NotNullType(new StringType()));

const SQL_STRING_ID_CACHE = new LRU<string, number>({max: 10000});

function cacheQueryStringRecords(queryStringRecords: PerfMetricSqlString[]) {
  queryStringRecords.forEach(({ id, sql_string }) => {
    const sqlHash = md5(sql_string);
    SQL_STRING_ID_CACHE.set(sqlHash, id);
  });
}

export function getSqlStringIdFromCache(sqlString?: string): { sql_string_id: number | null } {
  if (!sqlString) return { sql_string_id: null };
  const sqlHash = md5(sqlString);
  return { sql_string_id: SQL_STRING_ID_CACHE.get(sqlHash) ?? null };
}

async function insertAndCacheSqlStringRecords(sqlStrings: string[], connection: AnalyticsConnectionPool) {
  const sqlRecords = sqlStrings.map((sql_string) => ({sql_hash: md5(sql_string), sql_string}));
  const previouslyCachedSqlStrings = sqlRecords.filter(({ sql_hash }) => SQL_STRING_ID_CACHE.has(sql_hash));
  const newSqlRecords = sqlRecords.filter(({ sql_hash }) => !SQL_STRING_ID_CACHE.has(sql_hash));

  if (newSqlRecords.length === 0) {
    return;
  }

  // Insert and cache all the new query strings we don't already have cached
  const { sql, args } = new InsertQuery(perfMetricsSqlStringsTable, newSqlRecords as AnyBecauseHard, undefined, { conflictStrategy: 'ignore', returnInserted: true }).compile();
  const insertedQueryStringRecords = await connection.any<PerfMetricSqlString>(sql, args);
  cacheQueryStringRecords(insertedQueryStringRecords);

  // The insert query has a RETURNING * but that doesn't return anything for the ON CONFLICT DO NOTHING cases, so we need to fetch those separately
  const insertedQueryStrings = insertedQueryStringRecords.map(record => record.sql_string);
  const cachedQueryStrings = new Set([...previouslyCachedSqlStrings, ...insertedQueryStrings]);
  const missingQueryStrings = sqlStrings.filter(queryString => !cachedQueryStrings.has(queryString));

  if (missingQueryStrings.length > 0) {
    const { sql, args } = new SelectQuery(perfMetricsSqlStringsTable, { sql_string: { $in: missingQueryStrings } }).compile();
    const remainingQueryStringRecords = await connection.any(sql, args);
    cacheQueryStringRecords(remainingQueryStringRecords);
  }
}

export async function insertAndCacheSqlStringsInBatch(batch: PerfMetric[], connection: AnalyticsConnectionPool) {
  const sqlStringsInBatch = uniq(filterNonnull(batch.map(metric => metric.sql_string)));
  if (sqlStringsInBatch.length > 0) {
    await insertAndCacheSqlStringRecords(sqlStringsInBatch, connection);
  }
}
