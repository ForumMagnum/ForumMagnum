import { addGraphQLSchema } from './vulcan-lib/graphql';
import { RateLimiter } from './rateLimiter';
import React, { useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react'
import { hookToHoc } from './hocUtils'
import { isClient, isServer, isDevelopment, isAnyTest } from './executionEnvironment';
import { ColorHash } from './vendor/colorHash';
import { DatabasePublicSetting } from './publicSettings';
import { getPublicSettingsLoaded } from './settingsCache';
import { throttle } from 'underscore';
import moment from 'moment';
import { Globals } from './vulcan-lib/config';

const showAnalyticsDebug = new DatabasePublicSetting<"never"|"dev"|"always">("showAnalyticsDebug", "dev");
const flushIntervalSetting = new DatabasePublicSetting<number>("analyticsFlushInterval", 1000);

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
  
  // serverPendingEvents: Analytics events that were recorded during startup
  // before we were ready to write them to the analytics DB.
  serverPendingEvents: [],
};

function getShowAnalyticsDebug() {
  if (isAnyTest)
    return false;
  const debug = getPublicSettingsLoaded() ? showAnalyticsDebug.get() : "dev";
  if (debug==="always")
    return true;
  else if (debug==="dev")
    return isDevelopment;
  else
    return false;
}

export type EventProps = AnalyticsProps | Record<string, Json | undefined>;

export function captureEvent(eventType: string, eventProps?: EventProps, suppressConsoleLog = false) {
  try {
    if (isServer) {
      // If run from the server, we can run this immediately except for a few
      // events during startup.
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
      if (AnalyticsUtil.serverWriteEvent) {
        AnalyticsUtil.serverWriteEvent(event);
      } else {
        AnalyticsUtil.serverPendingEvents.push(event);
        if (AnalyticsUtil.serverPendingEvents.length > 1000) {
          // This is only supposed to be a temporary thing during startup until a
          // postgres connection is established, so report an error if there's a
          // ton of stuff in this array
          // eslint-disable-next-line no-console
          console.log(`Possible memory leak: AnalyticsUtil.serverPendingEvents.length=${AnalyticsUtil.serverPendingEvents.length}`);
        }
      }
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

type TrackingContext = Record<string, unknown>;

const ReactTrackingContext = React.createContext<TrackingContext>({});

export type AnalyticsProps = {
  pageContext?: string,
  pageSectionContext?: string,
  pageSubSectionContext?: string,
  pageElementContext?: string,
  pageElementSubContext?: string,
  reviewYear?: string,
  path?: string,
  resourceName?: string,
  resourceUrl?: string,
  chapter?: string,
  documentSlug?: string,
  postId?: string,
  sequenceId?: string,
  commentId?: string,
  tagId?: string,
  tagName?: string,
  tagSlug?: string,
  userIdDisplayed?: string,
  hoverPreviewType?: string,
  sortedBy?: string,
  branch?: string,
  siteEvent?: string,
  href?: string,
  limit?: number,
  capturePostItemOnMount?: boolean,
  singleLineComment?: boolean,
  feedType?: string,
  onsite?: boolean,
  terms?: PostsViewTerms,
  viewType?: string,
  /** @deprecated Use `pageSectionContext` instead */
  listContext?: string,
  /** @deprecated Use `pageSectionContext` instead */
  pageSection?: "karmaChangeNotifer",
  /** @deprecated Use `pageSubSectionContext` instead */
  pageSubsectionContext?: "latestReview",
}

/**
HOW TO USE ANALYTICS CONTEXT WRAPPER COMPONENTS
When you create a new feature (page, widget,button, etc.) or change the structure of a page, 
you should wrap the relevant components in an <AnalyticsContext> component. These 
components allow passing contextual information to the analytics event capture 
that allow us to know where various events (e.g. clicks, postItem Mounts) occur.

To use an AnalyticsContext component, you wrap the components you are adding context
to in a <AnalyticsContext> component. Data is added to the context by using props, e.g.
<AnalyticsContext contextLabelOne="foo" contextLabelTwo={bar.baz._id}>
  <MyNewFeature/>
</AnalyticsContext> 

You can use analyticsContext to add whatever info you want to events captured in a section, however,
there is a convention for how to track __where__ a tracking event occurs. Please use the
following system of context labels for tracking event location:

USE THIS CONVENTION FOR TRACKING EVENT LOCATION
* pageContext={page name}> e.g. tagPage, postPage, homePage
    - (only needs to defined once for each page)
* pageSectionContext={sectionName}, e.g. recentDiscussion, gatherTownWidget, wikiSection, userDrafts
    - use for larger sections of a page
* pageSubSectionContext is used when a section meaningfully has subsections (such as bookmarks list within the recommendations section on the frontpage)
* pageElementContext={elementName}> e.g. hoverPreview, commentItem, answerItem
    -use when wanting to mark where within a section something occurs
* listContext is historical. Now just use pageSection.

When adding a new prop simply add it to the list in the type of the `props` argument here.
Arguments can be of any type that can be handled by JSON.stringify. It's fine to have a low
barrier for adding new props here.

Also, context labels and their values should be camelCase, e.g. `pageSectionContext="fromTheArchives"`, 
and *not* `page_section_context="From the Archives" or the like.

The best ways to learn the convention are 1) look at current usages, 2) discuss with others

WARNING! Once data has been recording with certain labels, it is difficult to change!
Please ensure that your context labeling follows the convention so future analysis is
easy for everyone.

WARNING! Be careful. Nested AnalyticsContext context share one context object so 1) you don't need
to repeat context labels, 2) they can overwrite each others – be carefule you don't
accidentally reuse a context label like "pageSectionContext" twice nested because the second usage
will overwrite the first.

NOTE! AnalyticsContext components will only add context data to events that are already
being tracked (e.g. linkClicks, navigate). If you've added a button or change of state, you
will likely have to add tracking manually with a captureEvent call. (Search codebase for examples or consult others)

The best way to ensure you are tracking correctly with is to look at the logs
in the client or server (ensure getShowAnalyticsDebug is returning true).
*/
export const AnalyticsContext = ({children, ...props}: AnalyticsProps & {
  children: ReactNode,
}) => {
  const existingContextData = useContext(ReactTrackingContext)

  // Create a child context, which is the parent context plus the provided props
  // merged on top of it. But create it in a referentially stable way: reuse
  // the same object, so that changes never cause child components to rerender.
  // (As long as they captured the context in the obvious way, they'll still get
  // the newest values of these props when they actually log an event.)
  const newContextData = useRef<TrackingContext>({...existingContextData});
  for (let key of Object.keys(props))
    newContextData.current[key] = props[key as keyof typeof props];

  return <ReactTrackingContext.Provider value={newContextData.current}>
    {children}
  </ReactTrackingContext.Provider>
}

// An empty object, used as an argument default value. If the argument default
// value were set to {} in the usual way, it would be a new instance of {} each
// time; this way, it's the same {}, which in turn matters for making
// useCallback return the same thing each tie.
const emptyEventProps: EventProps = {};

export function useTracking({eventType="unnamed", eventProps=emptyEventProps}: {
  eventType?: string,
  eventProps?: EventProps,
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

export function useOnMountTracking<T extends EventProps>({
  eventType="unnamed",
  eventProps,
  captureOnMount,
  skip=false,
}: {
  eventType?: string,
  eventProps?: T,
  captureOnMount?: boolean | ((eventProps: T) => boolean),
  skip?: boolean
}={}) {
  const trackingContext = useContext(ReactTrackingContext)
  useEffect(() => {
    const eventData: AnyBecauseTodo = {...trackingContext, ...eventProps}
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

export function useIsInView<T extends HTMLElement>({rootMargin='0px', threshold=0}={}) {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const [node, setNode] = useState<T | null>(null)

  const observer = useRef<IntersectionObserver | null>(null)

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

  return { setNode, entry, node }
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
let eventTypeLimiters: AnyBecauseTodo = {};

const throttledStoreEvent = (event: AnyBecauseTodo) => {
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
      exceeded: throttle(() => {
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
    if (getShowAnalyticsDebug()) {
      browserConsoleLogAnalyticsEvent(event, false);
    }

    limiters.eventCount.consumeResource(1);
    limiters.eventBandwidth.consumeResource(eventSize);
    pendingAnalyticsEvents.push(event);
  } else {
    if (getShowAnalyticsDebug()) {
      browserConsoleLogAnalyticsEvent(event, true);
    }
    limiters.exceeded();
  }
};

// Print an analytics event to the browser console, neatly formatted and folded
// up into one line.
function browserConsoleLogAnalyticsEvent(event: any, rateLimitExceeded: boolean) {
  // eslint-disable-next-line no-console
  const c = console;
  if (rateLimitExceeded) {
    c.groupCollapsed(`%cRate limit exceeded: ${event.type}`, "color:#c00000");
  } else {
    const color = new ColorHash({lightness: 0.5}).hex(event.type);
    c.groupCollapsed(`Analytics: %c${event.type}`, `color:${color}`);
  }
  for (let fieldName of Object.keys(event.props)) {
    c.log(`${fieldName}:`, event.props[fieldName]);
  }
  // Timestamp recorded on the server will differ. Obviously in part because of
  // the latency of the network, but also because we have a queue that we only
  // flush max once/second. And something something skew.
  c.log('[[time of day]]', moment().format('HH:mm:ss.SSS'));
  c.groupEnd();
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

Globals.captureEvent = captureEvent;

let pendingAnalyticsEvents: Array<any> = [];

export function flushClientEvents() {
  if (!AnalyticsUtil.clientWriteEvents)
    return;
  if (!pendingAnalyticsEvents.length)
    return;

  const eventsToWrite = pendingAnalyticsEvents;
  pendingAnalyticsEvents = [];
  AnalyticsUtil.clientWriteEvents(eventsToWrite.map(event => ({
    ...(isClient ? AnalyticsUtil.clientContextVars : null),
    ...event
  })));
}

let lastFlushedAt: Date|null = null;
function throttledFlushClientEvents() {
  const flushInterval: number = flushIntervalSetting.get();
  const now = new Date();
  if(!lastFlushedAt || now.getTime()-lastFlushedAt.getTime() > flushInterval) {
    lastFlushedAt = now;
    flushClientEvents();
  }
}
