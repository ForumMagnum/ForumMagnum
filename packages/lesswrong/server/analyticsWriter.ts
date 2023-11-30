import { isDevelopment, onStartup } from '../lib/executionEnvironment';
import { randomId } from '../lib/random';
import { AnalyticsUtil } from '../lib/analyticsEvents';
import { PublicInstanceSetting } from '../lib/instanceSettings';
import { addStaticRoute } from './vulcan-lib/staticRoutes';
import { addGraphQLMutation, addGraphQLResolvers } from './vulcan-lib';
import {pgPromiseLib, getAnalyticsConnection, getMirrorAnalyticsConnection} from './analytics/postgresConnection'
import chunk from 'lodash/chunk';
import type { VariableValues } from 'apollo-server-types'

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

export interface PerfMetric {
  trace_id: string;
  op_type: string;
  op_name: string;
  started_at: Date;
  ended_at: Date;
  parent_trace_id?: string;
  client_path?: string;
  variables?: VariableValues
}

const perfMetricsColumnSet = new pgPromiseLib.helpers.ColumnSet(['trace_id', 'op_type', 'op_name', 'started_at', 'ended_at', 'parent_trace_id', 'client_path', 'gql_variables', 'environment'], {table: 'perf_metrics'});

const queuedPerfMetrics: PerfMetric[] = []; 

export function queuePerfMetric(perfMetric: PerfMetric) {
  queuedPerfMetrics.push(perfMetric);
  void flushPerfMetrics();
}

async function flushPerfMetrics() {
  if (queuedPerfMetrics.length < 100) return;

  const connection = getAnalyticsConnection();
  if (!connection) return;
   
  const metricsToWrite = queuedPerfMetrics.splice(0);
  for (const batch of chunk(metricsToWrite, 100)) {
    try {
      const environmentDescription = isDevelopment ? "development" : environmentDescriptionSetting.get()
      const valuesToInsert = batch.map(perfMetric => ({
        ...perfMetric,
        environment: environmentDescription,
        parent_trace_id: perfMetric.parent_trace_id ?? null,
        client_path: perfMetric.client_path ?? null,
        gql_variables: perfMetric.variables ?? null
      }));
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
