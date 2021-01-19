import { addGraphQLSchema, Vulcan } from './vulcan-lib';
import { CallbackChainHook } from './vulcan-lib/callbacks';
import { RateLimiter } from './rateLimiter';
import React, { useContext, useEffect, useState, useRef, useCallback } from 'react'
import { hookToHoc } from './hocUtils'
import { isClient, isServer } from './executionEnvironment';
import * as _ from 'underscore';

addGraphQLSchema(`
  type AnalyticsEvent {
    type: String!,
    timestamp: Date!,
    props: JSON!
  }
`);

// AnalyticsUtil: An object/namespace full of functions which need to bypass
// the normal import system, because they are client- or server-specific but
// are used by code which isn't.
export const AnalyticsUtil: any = {
  // clientWriteEvents: Send a graphQL mutation from the client to the server
  // with an array of events. Available only on the client and when the react
  // tree is mounted, null otherwise; filled in by Components.AnalyticsClient.
  clientWriteEvents: null,

  // clientContextVars: A dictionary of variables that will be added to every
  // analytics event sent from the client. Client-side only.
  clientContextVars: {},

  // serverWriteEvent: Write a (single) event to the analytics database. Server-
  // side only, filled in in analyticsWriter.js; null on the client. If no
  // analytics database is configured, does nothing.
  serverWriteEvent: null,
};

export function captureEvent(eventType: string, eventProps?: Record<string,any>) {
  try {
    if (isServer) {
      // If run from the server, put this directly into the server's write-to-SQL
      // queue.
      AnalyticsUtil.serverWriteEvent({
        type: eventType,
        timestamp: new Date(),
        props: {
          ...eventProps
        },
      });
    } else if (isClient) {
      // If run from the client, make a graphQL mutation
      const event = {
        type: eventType,
        timestamp: new Date(),
        props: {
          ...AnalyticsUtil.clientContextVars,
          ...eventProps,
        },
      };
      throttledStoreEvent(event);
      throttledFlushClientEvents();
    }
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error("Error while capturing analytics event: ", e); //eslint-disable-line
  }
}


const ReactTrackingContext = React.createContext({});

export const AnalyticsContext = ({children, ...props}) => {
  const existingContextData = useContext(ReactTrackingContext)
  
  // Create a child context, which is the parent context plus the provided props
  // merged on top of it. But create it in a referentially stable way: reuse
  // the same object, so that changes never cause child components to rerender.
  // (As long as they captured the context in the obvious way, they'll still get
  // the newest values of these props when they actually log an event.)
  const newContextData = useRef({...existingContextData});
  for (let key of Object.keys(props))
    newContextData.current[key] = props[key];
  
  return <ReactTrackingContext.Provider value={newContextData.current}>
    {children}
  </ReactTrackingContext.Provider>
}

// An empty object, used as an argument default value. If the argument default
// value were set to {} in the usual way, it would be a new instance of {} each
// time; this way, it's the same {}, which in turn matters for making
// useCallback return the same thing each tie.
const emptyEventProps = {};

export function useTracking({eventType="unnamed", eventProps=emptyEventProps, skip=false}: {
  eventType?: string,
  eventProps?: any,
  skip?: boolean
}={}) {
  const trackingContext = useContext(ReactTrackingContext)

  const track = useCallback((type?: string|undefined, trackingData?: Record<string,any>) => {
    captureEvent(type || eventType, {
      ...trackingContext,
      ...eventProps,
      ...trackingData
    })
  }, [trackingContext, eventProps, eventType])
  return {captureEvent: track}
}

export const withTracking = hookToHoc(useTracking)

export function useOnMountTracking({eventType="unnamed", eventProps=emptyEventProps, captureOnMount, skip=false}: {
  eventType?: string,
  eventProps?: any,
  captureOnMount?: any,
  skip?: boolean
}={}) {
  const trackingContext = useContext(ReactTrackingContext)
  useEffect(() => {
    const eventData = {...trackingContext, ...eventProps}
    if (typeof captureOnMount === "function") {
      !skip && captureOnMount(eventData) && captureEvent(`${eventType}Mounted`, eventData)
    } else if (!!captureOnMount) {
      !skip && captureEvent(`${eventType}Mounted`, eventData)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip])

  const track = useCallback((type?: string|undefined, trackingData?: Record<string,any>) => {
    captureEvent(type || eventType, {
      ...trackingContext,
      ...eventProps,
      ...trackingData
    })
  }, [trackingContext, eventProps, eventType])
  return {captureEvent: track}
}

export function useIsInView({rootMargin='0px', threshold=0}={}) {
  const [entry, setEntry] = useState<any>(null)
  const [node, setNode] = useState<any>(null)

  const observer = useRef<any>(null)

  useEffect(() => {
    if (!window.IntersectionObserver) return

    if (observer.current && node) observer.current.disconnect()

    observer.current = new window.IntersectionObserver(([ entry ]) => {
      setEntry(entry)
    }, {
      rootMargin,
      threshold
    })

    const { current: currentObserver } = observer

    if (node) currentObserver.observe(node)

    return () => currentObserver.disconnect()
  }, [node, rootMargin, threshold])

  return { setNode, entry }
}


// Analytics events have two rate limits, one denominated in events per second,
// the other denominated in uncompressed kilobytes per second. Each of these
// has a burst limit and a steady-state limit. If either rate limit is exceeded,
// a rateLimitExceeded event is sent instead of the original event.
//
// For purposes of calculating rate limits, the size of an event is the JSON
// string length. This undercounts slightly due to Unicode and protocol
// overhead, and overcounts greatly due to compression.
const burstLimitEventCount = 10;
const burstLimitKB = 20;
const rateLimitEventsPerSec = 3.0;
const rateLimitKBps = 5;
const rateLimitEventIntervalMs = 5000;
let eventTypeLimiters = {};

const throttledStoreEvent = (event) => {
  const now = new Date();
  const eventType = event.type;
  const eventSize = JSON.stringify(event).length;

  if (!(eventType in eventTypeLimiters)) {
    eventTypeLimiters[eventType] = {
      eventCount: new RateLimiter({
        burstLimit: burstLimitEventCount,
        steadyStateLimit: rateLimitEventsPerSec,
        timestamp: now
      }),
      eventBandwidth: new RateLimiter({
        burstLimit: burstLimitKB*1024,
        steadyStateLimit: rateLimitKBps*1024,
        timestamp: now
      }),
      exceeded: _.throttle(() => {
        pendingAnalyticsEvents.push({
          type: "rateLimitExceeded",
          timestamp: now,
          props: {
            originalType: eventType
          },
        });
      }, rateLimitEventIntervalMs),
    };
  }
  const limiters = eventTypeLimiters[eventType];
  limiters.eventCount.advanceTime(now);
  limiters.eventBandwidth.advanceTime(now);

  if (limiters.eventCount.canConsumeResource(1)
    && limiters.eventBandwidth.canConsumeResource(eventSize))
  {
    limiters.eventCount.consumeResource(1);
    limiters.eventBandwidth.consumeResource(eventSize);
    pendingAnalyticsEvents.push(event);
  } else {
    limiters.exceeded();
  }
};

Vulcan.captureEvent = captureEvent;

let pendingAnalyticsEvents: Array<any> = [];

function flushClientEvents() {
  if (!AnalyticsUtil.clientWriteEvents)
    return;
  if (!pendingAnalyticsEvents.length)
    return;

  AnalyticsUtil.clientWriteEvents(pendingAnalyticsEvents.map(event => ({
    ...(isClient ? AnalyticsUtil.clientContextVars : null),
    ...event
  })));
  pendingAnalyticsEvents = [];
}
const throttledFlushClientEvents = _.throttle(flushClientEvents, 1000);

export const userIdentifiedCallback = new CallbackChainHook<UsersCurrent|DbUser,[]>("events.identify");
