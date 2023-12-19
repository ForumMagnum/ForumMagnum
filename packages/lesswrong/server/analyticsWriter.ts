import { isDevelopment, onStartup } from '../lib/executionEnvironment';
import { randomId } from '../lib/random';
import { AnalyticsUtil } from '../lib/analyticsEvents';
import { PublicInstanceSetting } from '../lib/instanceSettings';
import { addStaticRoute } from './vulcan-lib/staticRoutes';
import { addGraphQLMutation, addGraphQLResolvers } from '../lib/vulcan-lib/graphql';
import { pgPromiseLib, getAnalyticsConnection, AnalyticsConnectionPool } from './analytics/postgresConnection'
import chunk from 'lodash/chunk';
import Table from '../lib/sql/Table';
import { NotNullType, StringType, IntType } from '../lib/sql/Type';
import InsertQuery from '../lib/sql/InsertQuery';
import { filterNonnull } from '../lib/utils/typeGuardUtils';
import SelectQuery from '../lib/sql/SelectQuery';
import uniq from 'lodash/uniq';
import md5 from 'md5';
import { performanceMetricLoggingBatchSize } from '../lib/publicSettings';
import LRU from 'lru-cache';

// Since different environments are connected to the same DB, this setting cannot be moved to the database
export const environmentDescriptionSetting = new PublicInstanceSetting<string>("analytics.environment", "misconfigured", "warning")

const serverId = randomId();

const isValidEventAge = (age: number) => age>=0 && age<=60*60*1000;

addGraphQLResolvers({
  Mutation: {
    analyticsEvent(root: void, { events, now: clientTime }: AnyBecauseTodo, context: ResolverContext) {
      void handleAnalyticsEventWriteRequest(events, clientTime);
    },
  }
});
addGraphQLMutation('analyticsEvent(events: [JSON!], now: Date): Boolean');

addStaticRoute('/analyticsEvent', ({query}, req, res, next) => {
  if (req.method !== "POST") {
    res.statusCode = 405; // Method not allowed
    res.end("analyticsEvent endpoint should receive POST");
    return;
  }
  
  const body = (req as any).body; //Type system doesn't know body-parser middleware has filled this in
  
  if (!body?.events || !body?.now) {
    res.statusCode = 405; // Method not allowed
    res.end('analyticsEvent endpoint should be JSON with fields "events" and "now"');
    return;
  }
  
  void handleAnalyticsEventWriteRequest(body.events, body.now);
  res.writeHead(200, {
    "Content-Type": "text/plain;charset=UTF-8"
  });
  res.end("ok");
});

async function handleAnalyticsEventWriteRequest(events: AnyBecauseTodo, clientTime: AnyBecauseTodo) {
  // Adjust timestamps to account for server-client clock skew
  // The mutation comes with a timestamp on each event from the client
  // clock, and a timestamp representing when events were flushed, also
  // from the client clock. We use these to translate from absolute time to
  // relative time (ie, age), and apply that age as an offset relative to
  // the server clock.
  // If an event age is <0 or >1h, ignore its timestamp entirely, assume
  // that means that timestamp is broken (eg, the clock was reset while
  // events were being captured); in that case, use the time it reached the
  // server instead.
  const serverTime = new Date();
  
  let augmentedEvents = events.map((event: AnyBecauseTodo) => {
    const eventTime = new Date(event.timestamp);
    const age = clientTime.valueOf() - eventTime.valueOf();
    const adjustedTimestamp = isValidEventAge(age) ? new Date(serverTime.valueOf()-age.valueOf()) : serverTime;
    
    return {...event, timestamp: adjustedTimestamp};
  });
  await writeEventsToAnalyticsDB(augmentedEvents);
  return true;
}

let inFlightRequestCounter = {inFlightRequests: 0};
// See: https://stackoverflow.com/questions/37300997/multi-row-insert-with-pg-promise
const analyticsColumnSet = new pgPromiseLib.helpers.ColumnSet(['environment', 'event_type', 'timestamp', 'event'], {table: 'raw'});

// If you want to capture an event, this is not the function you're looking for;
// use captureEvent.
// Writes an event to the analytics database.
async function writeEventsToAnalyticsDB(events: {type: string, timestamp: Date, props: AnyBecauseTodo}[]) {
  const connection = getAnalyticsConnection()
  
  if (connection) {
    try {
      const environmentDescription = isDevelopment ? "development" : environmentDescriptionSetting.get()
      const valuesToInsert = events.map(ev => ({
        environment: environmentDescription,
        event_type: ev.type,
        timestamp: ev.timestamp,
        event: ev.props,
      }));
      const query = pgPromiseLib.helpers.insert(valuesToInsert, analyticsColumnSet);
    
      if (inFlightRequestCounter.inFlightRequests > 500) {
        // eslint-disable-next-line no-console
        console.error(`Warning: ${inFlightRequestCounter.inFlightRequests} in-flight postgres queries. Dropping.`);
        return;
      }
      
      
      inFlightRequestCounter.inFlightRequests++;
      try {
        await connection?.none(query);
      } finally {
        inFlightRequestCounter.inFlightRequests--;
      }
    } catch (err){
      //eslint-disable-next-line no-console
      console.error("Error sending events to analytics DB:");
      //eslint-disable-next-line no-console
      console.error(err);
    }
  }
}

const perfMetricsColumnSet = new pgPromiseLib.helpers.ColumnSet(['trace_id', 'op_type', 'op_name', 'started_at', 'ended_at', 'parent_trace_id', 'client_path', 'extra_data', 'gql_string_id', 'ip', 'user_agent', 'environment'], {table: 'perf_metrics'});

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

function getGqlStringIdFromCache(gqlString?: string): { gql_string_id: number | null } {
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

const queuedPerfMetrics: PerfMetric[] = [];

export function queuePerfMetric(perfMetric: PerfMetric) {
  queuedPerfMetrics.push(perfMetric);
  void flushPerfMetrics();
}

async function flushPerfMetrics() {
  const batchSize = performanceMetricLoggingBatchSize.get()

  if (queuedPerfMetrics.length < batchSize) return;

  const connection = getAnalyticsConnection();
  if (!connection) return;
   
  const metricsToWrite = queuedPerfMetrics.splice(0);
  for (const batch of chunk(metricsToWrite, batchSize)) {
    try {
      const environmentDescription = isDevelopment ? "development" : environmentDescriptionSetting.get();

      const queryStringsInBatch = uniq(filterNonnull(batch.map(metric => metric.gql_string)));
      if (queryStringsInBatch.length > 0) {
        await insertAndCacheGqlStringRecords(queryStringsInBatch, connection);
      }

      const valuesToInsert = batch.map(perfMetric => {
        const { gql_string, ...rest } = perfMetric;
        const gqlStringId = getGqlStringIdFromCache(gql_string);

        return {
          ...rest,
          environment: environmentDescription,
          parent_trace_id: perfMetric.parent_trace_id ?? null,
          client_path: perfMetric.client_path ?? null,
          extra_data: perfMetric.extra_data ?? null,
          ip: perfMetric.ip ?? null,
          user_agent: perfMetric.user_agent ?? null,
          user_id: perfMetric.user_id ?? null,
          ...gqlStringId
        }
      });
      const query = pgPromiseLib.helpers.insert(valuesToInsert, perfMetricsColumnSet);
      
      inFlightRequestCounter.inFlightRequests++;
      try {
        await connection?.none(query);
      } finally {
        inFlightRequestCounter.inFlightRequests--;
      }
    } catch (err){
      //eslint-disable-next-line no-console
      console.error("Error sending events to analytics DB:");
      //eslint-disable-next-line no-console
      console.error(err);
    }
  }
}

export async function pruneOldPerfMetrics() {
  const connection = getAnalyticsConnection();
  if (!connection) {
    // eslint-disable-next-line no-console
    console.error('Missing connection to analytics DB when trying to prune old perf metrics');
    return;
  }

  try {
    await connection.none(`
      DELETE
      FROM perf_metrics
      WHERE started_at < CURRENT_DATE - INTERVAL '30 days'
    `);

    await connection.none(`
      SET LOCAL work_mem = '2GB';

      DELETE
      FROM perf_metrics
      WHERE id IN (
        WITH queries AS (
          SELECT id, parent_trace_id
          FROM perf_metrics q
          WHERE q.started_at BETWEEN CURRENT_DATE - INTERVAL '9 days' AND CURRENT_DATE - INTERVAL '7 days'
            -- We keep 1/16th of the older perf metrics using the last character of the trace id for random sampling
            AND SUBSTR(q.trace_id, 36, 1) != '0'
            AND q.op_type = 'query'
        )
        SELECT queries.id
        FROM queries
        UNION
        SELECT pm.id
        FROM perf_metrics pm
        JOIN queries
        ON pm.trace_id = queries.parent_trace_id
        UNION
        SELECT ch.id
        FROM perf_metrics ch
        WHERE ch.op_name = 'cacheHit'
          AND ch.started_at BETWEEN CURRENT_DATE - INTERVAL '9 days' AND CURRENT_DATE - INTERVAL '7 days'
          AND SUBSTR(ch.trace_id, 36, 1) != '0'
      )
    `);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error when pruning old perf metrics', { err });
  }
}

function serverWriteEvent({type, timestamp, props}: AnyBecauseTodo) {
  void writeEventsToAnalyticsDB([{
    type, timestamp,
    props: {
      ...props,
      serverId: serverId,
    }
  }]);
}

onStartup(() => {
  AnalyticsUtil.serverWriteEvent = serverWriteEvent;
  
  const deferredEvents = AnalyticsUtil.serverPendingEvents;
  AnalyticsUtil.serverPendingEvents = [];
  for (let event of deferredEvents) {
    serverWriteEvent(event);
  }
});
