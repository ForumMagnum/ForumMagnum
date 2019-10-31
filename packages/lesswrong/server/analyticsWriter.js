import { addGraphQLMutation, addGraphQLResolvers, getSetting } from 'meteor/vulcan:core';
import { Pool } from 'pg'
import { AnalyticsUtil } from '../lib/analyticsEvents.js';

const environment = getSetting("analytics.environment", "misconfigured");
const connectionString = getSetting("analytics.connectionString", null);

addGraphQLResolvers({
  Mutation: {
    analyticsEvent(root, { events }, context) {
      for (let event of events) {
        serverWriteEvent(event);
      }
      return true;
    },
  }
});
addGraphQLMutation('analyticsEvent(events: [JSON!]): Boolean');

if (!connectionString) {
  //eslint-disable-next-line no-console
  console.log("Analytics logging disabled: analytics.connectionString is not configured");
}

let analyticsConnectionPool = null;
// Return the Analytics database connection pool, if configured. If no
// analytics DB is specified in the server config, returns null instead. The
// first time this is called, it will block briefly.
export const getAnalyticsConnection = () => {
  if (!connectionString)
    return null;
  if (!analyticsConnectionPool)
    analyticsConnectionPool = new Pool({ connectionString });
  return analyticsConnectionPool;
}

const getAnalyticsEnvironmentDescription = () => {
  if (Meteor.isDevelopment)
    return "development";
  else
    return environment;
}

// TODO: Defer/batch so that this doesn't affect SSR speed?
export function serverWriteEvent(eventProps) {
  const queryStr = 'insert into raw(environment, event_type, timestamp, event) values ($1,$2,$3,$4)';
  const environment = getAnalyticsEnvironmentDescription();
  const queryValues = [environment, eventProps.type, new Date(), eventProps];
  
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

AnalyticsUtil.serverWriteEvent = serverWriteEvent;
