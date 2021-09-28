import { isDevelopment, isAnyTest, onStartup } from '../lib/executionEnvironment';
import { randomId } from '../lib/random';
import { Pool } from 'pg';
import { AnalyticsUtil } from '../lib/analyticsEvents';
import { PublicInstanceSetting } from '../lib/instanceSettings';

import { addGraphQLMutation, addGraphQLResolvers } from './vulcan-lib';
import { getAnalyticsConnection } from './analytics/postgresConnection'
import { queryResult } from 'pg-promise';

// Since different environments are connected to the same DB, this setting cannot be moved to the database
const environmentDescriptionSetting = new PublicInstanceSetting<string>("analytics.environment", "misconfigured", "warning")

const serverId = randomId();

const isValidEventAge = (age) => age>=0 && age<=60*60*1000;

addGraphQLResolvers({
  Mutation: {
    analyticsEvent(root, { events, now: clientTime }, context: ResolverContext) {
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
      
      for (let event of events) {
        const eventTime = new Date(event.timestamp);
        const age = clientTime.valueOf() - eventTime.valueOf();
        const adjustedTimestamp = isValidEventAge(age) ? new Date(serverTime.valueOf()-age.valueOf()) : serverTime;
        
        let eventCopy = {...event, timestamp: adjustedTimestamp};
        void writeEventToAnalyticsDB(eventCopy);
      }
      return true;
    },
  }
});
addGraphQLMutation('analyticsEvent(events: [JSON!], now: Date): Boolean');


// If you want to capture an event, this is not the function you're looking for;
// use captureEvent.
// Writes an event to the analytics database.
// TODO: Defer/batch so that this doesn't affect SSR speed?
async function writeEventToAnalyticsDB({type, timestamp, props}) {
  const queryStr = 'insert into raw(environment, event_type, timestamp, event) values ($1,$2,$3,$4)';
  const environmentDescription = isDevelopment ? "development" : environmentDescriptionSetting.get()
  const queryValues = [environmentDescription, type, timestamp, props];
  
  const connection = getAnalyticsConnection();
  if (connection) {
    try {
      await connection.query(queryStr, queryValues, queryResult.none)
    } catch (err){
      //eslint-disable-next-line no-console
      console.error("Error sending events to analytics DB:");
      //eslint-disable-next-line no-console
      console.error(err);
    }
  }
}

function serverWriteEvent({type, timestamp, props}) {
  void writeEventToAnalyticsDB({
    type, timestamp,
    props: {
      ...props,
      serverId: serverId,
    }
  });
}

onStartup(() => {
  AnalyticsUtil.serverWriteEvent = serverWriteEvent;
  
  const deferredEvents = AnalyticsUtil.serverPendingEvents;
  AnalyticsUtil.serverPendingEvents = [];
  for (let event of deferredEvents) {
    serverWriteEvent(event);
  }
});
