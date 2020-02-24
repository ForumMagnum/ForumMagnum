import { addGraphQLMutation, addGraphQLResolvers, getSetting } from './vulcan-lib';
import { Pool } from 'pg'
import { AnalyticsUtil } from '../lib/analyticsEvents';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

const connectionString = getSetting("analytics.connectionString", null);
const environmentDescription = Meteor.isDevelopment ? "development" : getSetting("analytics.environment", "misconfigured");

const serverId = Random.id();

const isValidEventAge = (age) => age>=0 && age<=60*60*1000;

addGraphQLResolvers({
  Mutation: {
    analyticsEvent(root, { events, now: clientTime }, context) {
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
        writeEventToAnalyticsDB(eventCopy);
      }
      return true;
    },
  }
});
addGraphQLMutation('analyticsEvent(events: [JSON!], now: Date): Boolean');

if (!connectionString) {
  //eslint-disable-next-line no-console
  console.log("Analytics logging disabled: analytics.connectionString is not configured");
}

let analyticsConnectionPool = null;
// Return the Analytics database connection pool, if configured. If no
// analytics DB is specified in the server config, returns null instead. The
// first time this is called, it will block briefly.
const getAnalyticsConnection = (): Pool|null => {
  if (!connectionString)
    return null;
  if (!analyticsConnectionPool)
    analyticsConnectionPool = new Pool({ connectionString });
  return analyticsConnectionPool;
}

// If you want to capture an event, this is not the function you're looking for;
// use captureEvent.
// Writes an event to the analytics database.
// TODO: Defer/batch so that this doesn't affect SSR speed?
function writeEventToAnalyticsDB({type, timestamp, props}) {
  const queryStr = 'insert into raw(environment, event_type, timestamp, event) values ($1,$2,$3,$4)';
  const queryValues = [environmentDescription, type, timestamp, props];
  
  const connection = getAnalyticsConnection();
  if (connection) {
    connection.query(queryStr, queryValues, (err, res) => {
      if (err) {
        //eslint-disable-next-line no-console
        console.error("Error sending events to analytics DB:");
        //eslint-disable-next-line no-console
        console.error(err);
      }
    })
  }
}

function serverWriteEvent({type, timestamp, props}) {
  writeEventToAnalyticsDB({
    type, timestamp,
    props: {
      ...props,
      serverId: serverId,
    }
  });
}

AnalyticsUtil.serverWriteEvent = serverWriteEvent;
