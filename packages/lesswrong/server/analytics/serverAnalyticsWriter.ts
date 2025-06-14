import { isDevelopment, isE2E } from '@/lib/executionEnvironment';
import { randomId } from '@/lib/random';
import { PublicInstanceSetting, performanceMetricLoggingBatchSize } from '@/lib/instanceSettings';
import { addStaticRoute } from '@/server/vulcan-lib/staticRoutes';
import { pgPromiseLib, getAnalyticsConnection } from './postgresConnection'
import chunk from 'lodash/chunk';
import gql from 'graphql-tag';
import type { EventProps } from '@/lib/analyticsEvents';
import { getShowAnalyticsDebug } from '@/lib/analyticsDebugging';
import { ColorHash } from '@/lib/vendor/colorHash';
import moment from 'moment';

// Since different environments are connected to the same DB, this setting cannot be moved to the database
export const environmentDescriptionSetting = new PublicInstanceSetting<string>("analytics.environment", "misconfigured", "warning")

export const serverId = randomId();

const isValidEventAge = (age: number) => age>=0 && age<=60*60*1000;

export const analyticsEventTypeDefs = gql`
  extend type Mutation {
    analyticsEvent(events: [JSON!], now: Date): Boolean
  }
`

export const analyticsEventGraphQLMutations = {
  analyticsEvent(root: void, { events, now: clientTime }: AnyBecauseTodo, context: ResolverContext) {
    void handleAnalyticsEventWriteRequest(events, clientTime);
  },
}

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

  // I really needed to break an import cycle involving `analyticsEvents.tsx` and `Table.ts`
  // This seemed like the least-bad place to do it.
  // TODO: If you can figure out a better way, please do.
  const {
    constructPerfMetricBatchInsertQuery,
    insertAndCacheNormalizedDataInBatch,
    perfMetricsColumnSet
  }: typeof import('@/server/perfMetricsWriter/perfMetricsWriter') = require('@/server/perfMetricsWriter/perfMetricsWriter');
   
  const metricsToWrite = queuedPerfMetrics.splice(0);
  for (const batch of chunk(metricsToWrite, batchSize)) {
    try {
      await insertAndCacheNormalizedDataInBatch(batch, connection);

      const environmentDescription = isDevelopment ? "development" : environmentDescriptionSetting.get();
      const valuesToInsert = constructPerfMetricBatchInsertQuery(batch, environmentDescription);
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

/**
 * Write a (single) event to the analytics database. Server-side only; if
 * called from the client goes to a stub which throws an exception. If no
 * analytics database is configured, does nothing.
 */
export function serverWriteEvent(event: AnyBecauseTodo) {
  const { type, timestamp, props } = event;
  if (pendingEvents) {
    pendingEvents.push(event);
    return;
  }
  void writeEventsToAnalyticsDB([{
    type, timestamp,
    props: {
      ...props,
      serverId: serverId,
    }
  }]);
}

function serverConsoleLogAnalyticsEvent(event: any) {
  const [r,g,b] = new ColorHash({lightness: 0.5}).rgb(event.type);
  const colorEscapeSeq = `\x1b[38;2;0;${r};${g};${b}m`;
  const endColorEscapeSeq = '\x1b[0m';
  // eslint-disable-next-line no-console
  console.log(`Analytics event: ${colorEscapeSeq}${event.type}${endColorEscapeSeq}`, {
    ...event.props,
    '[[time of day]]': moment().format('HH:mm:ss.SSS')
  });
}

export function serverCaptureEvent(eventType: string, eventProps?: EventProps, suppressConsoleLog = false) {
  if (isE2E) {
    return;
  }

  try {
    const event = {
      type: eventType,
      timestamp: new Date(),
      props: {
        ...eventProps
      }
    }
    if (!suppressConsoleLog && getShowAnalyticsDebug()) {
      serverConsoleLogAnalyticsEvent(event);
    }
    serverWriteEvent(event);
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error("Error while capturing analytics event: ", e);
  }
}

// Analytics events that were recorded during startup before we were ready
// to write them to the analytics DB.
let pendingEvents: any[]|null = [];

export function startAnalyticsWriter() {
  const deferredEvents = pendingEvents;
  pendingEvents = null;
  if (deferredEvents) {
    for (let event of deferredEvents) {
      serverWriteEvent(event);
    }
  }
}
