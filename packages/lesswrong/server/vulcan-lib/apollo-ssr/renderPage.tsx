/**
 * Render the page server side
 * @see https://github.com/szomolanyi/MeteorApolloStarter/blob/master/imports/startup/server/ssr.js
 * @see https://github.com/apollographql/GitHunt-React/blob/master/src/server.js
 * @see https://www.apollographql.com/docs/react/features/server-side-rendering.html#renderToStringWithData
 */
import React from 'react';
import ReactDOM from 'react-dom/server';
import { renderToStringWithData } from '@apollo/client/react/ssr';
import { computeContextFromUser, configureSentryScope } from '../apollo-server/context';

import { wrapWithMuiTheme } from '../../material-ui/themeProvider';
import { Vulcan } from '../../../lib/vulcan-lib/config';
import { createClient } from './apolloClient';
import { cachedPageRender, recordCacheBypass} from './pageCache';
import { getAllUserABTestGroups, CompleteTestGroupAllocation, RelevantTestGroupAllocation } from '../../../lib/abTestImpl';
import Head from './components/Head';
import { embedAsGlobalVar, healthCheckUserAgentSetting } from './renderUtil';
import AppGenerator from './components/AppGenerator';
import { captureException } from '@sentry/core';
import { ServerRequestStatusContextType } from '../../../lib/vulcan-core/appContext';
import { getCookieFromReq, getPathFromReq, trySetResponseStatus } from '../../utils/httpUtil';
import { getThemeOptions, AbstractThemeOptions } from '../../../themes/themeNames';
import { renderJssSheetImports } from '../../utils/renderJssSheetImports';
import { DatabaseServerSetting } from '../../databaseSettings';
import type { Request, Response } from 'express';
import { DEFAULT_TIMEZONE } from '../../../lib/utils/timeUtil';
import { getIpFromRequest } from '../../datadog/datadogMiddleware';
import { addStartRenderTimeToPerfMetric, closeRequestPerfMetric, openPerfMetric, setAsyncStoreValue } from '../../perfMetrics';
import { maxRenderQueueSize, queuedRequestTimeoutSecondsSetting, commentPermalinkStyleSetting } from '../../../lib/publicSettings';
import { performanceMetricLoggingEnabled } from '../../../lib/instanceSettings';
import { getClientIP } from '@/server/utils/getClientIP';
import PriorityBucketQueue, { RequestData } from '../../../lib/requestPriorityQueue';
import { isAnyTest, isProduction } from '../../../lib/executionEnvironment';
import { LAST_VISITED_FRONTPAGE_COOKIE } from '../../../lib/cookies/cookies';
import { visitorGetsDynamicFrontpage } from '../../../lib/betas';
import { responseIsCacheable } from '../../cacheControlMiddleware';
import moment from 'moment';
import { preloadScrollToCommentScript } from '@/lib/scrollUtils';
import { ensureClientId } from '@/server/clientIdMiddleware';

const slowSSRWarnThresholdSetting = new DatabaseServerSetting<number>("slowSSRWarnThreshold", 3000);

type RenderTimings = {
  totalTime: number
  prerenderTime: number
  renderTime: number
}

export interface RenderSuccessResult {
  ssrBody: string
  headers: Array<string>
  serializedApolloState: string
  serializedForeignApolloState: string
  jssSheets: string
  status: number|undefined,
  redirectUrl: string|undefined
  relevantAbTestGroups: RelevantTestGroupAllocation
  allAbTestGroups: CompleteTestGroupAllocation
  themeOptions: AbstractThemeOptions,
  renderedAt: Date,
  cacheFriendly: boolean,
  timezone: string,
  timings: RenderTimings,
  aborted: false,
  prefetchedResources: Promise<boolean | undefined>,
}

interface RenderAbortResult {
  aborted: true;
}

export type RenderResult = RenderSuccessResult | RenderAbortResult;

interface CacheMissParams {
  cacheAttempt: true;
  prefetchedResources: Promise<boolean | undefined>;
}

interface CacheSkipParams {
  cacheAttempt: false;
  maybePrefetchResources: () => Promise<boolean | undefined>;
}

interface BaseRenderRequestParams {
  req: Request,
  user: DbUser|null,
  startTime: Date,
  res: Response,
  userAgent?: string,
}

type RenderRequestParams = BaseRenderRequestParams & (CacheMissParams | CacheSkipParams);

interface RenderPriorityQueueSlot extends RequestData {
  callback: () => Promise<void>;
  renderRequestParams: RenderRequestParams;
}

interface AttemptCachedRenderParams {
  req: Request;
  res: Response;
  startTime: Date;
  userAgent?: string;
  url: string;
  tabId: string|null;
  ip: string;
  cacheAttempt: true;
}

interface AttemptNonCachedRenderParams {
  req: Request;
  res: Response;
  startTime: Date;
  userAgent?: string;
  url: string;
  tabId: string|null;
  ip: string;
  cacheAttempt: false;
  user: DbUser|null;
}

function openRenderRequestPerfMetric(renderParams: AttemptCachedRenderParams | AttemptNonCachedRenderParams) {
  if (!performanceMetricLoggingEnabled.get()) return;

  const { req, startTime, userAgent } = renderParams;
  
  const userIdField = !renderParams.cacheAttempt
    ? { user_id: renderParams.user?._id }
    : {};

  const opName = renderParams.cacheAttempt
    ? "unknown"
    : "skipCache";

  const perfMetric = openPerfMetric({
    op_type: "ssr",
    op_name: opName,
    client_path: req.originalUrl,
    ip: getClientIP(req),
    user_agent: userAgent,
    ...userIdField,
  }, startTime);

  setAsyncStoreValue('requestPerfMetric', perfMetric);
}

function closeRenderRequstPerfMetric(rendered: RenderResult & { cached?: boolean }) {
  if (!performanceMetricLoggingEnabled.get()) return;

  setAsyncStoreValue('requestPerfMetric', (incompletePerfMetric) => {
    if (!incompletePerfMetric) return;

    if (incompletePerfMetric.op_name !== "unknown") {
      return incompletePerfMetric;
    }

    // If we're closing a request that was eligible for caching, we would have initially set the op_name to "unknown"
    // We need to set the op_name to "cacheHit" or "cacheMiss" here, after we've determined which it was
    const opName = rendered.cached ? "cacheHit" : "cacheMiss";
    return {
      ...incompletePerfMetric,
      op_name: opName
    }
  });

  closeRequestPerfMetric();
}

function recordSsrAnalytics(
  params: AttemptCachedRenderParams | AttemptNonCachedRenderParams,
  rendered: Exclude<RenderResult, { aborted: true }> & { cached?: boolean }
) {
  const { req, startTime, userAgent, url, tabId, ip } = params;

  if (!shouldRecordSsrAnalytics(userAgent)) return;

  const clientId = getCookieFromReq(req, "clientId");

  const userId = params.cacheAttempt
    ? null
    : params.user?._id;

  const timings = params.cacheAttempt
    ? { totalTime: new Date().valueOf() - startTime.valueOf() }
    : rendered.timings;

  const cached = params.cacheAttempt
    ? rendered.cached
    : false;

  const abTestGroups = rendered.allAbTestGroups;

  Vulcan.captureEvent("ssr", {
    url,
    tabId,
    clientId,
    ip,
    userAgent,
    userId,
    timings,
    abTestGroups,
    cached,
  });
}

function getRequestMetadata(req: Request) {
  const ip = getIpFromRequest(req)
  const userAgent = req.headers["user-agent"];
  const url = getPathFromReq(req);

  return { ip, userAgent, url };
}

function shouldSkipCache(req: Request, user: DbUser|null) {
  const { userAgent, url } = getRequestMetadata(req);

  const isHealthCheck = userAgent === healthCheckUserAgentSetting.get();

  // Skip the page-cache if the user-agent is Slackbot's link-preview fetcher
  // because we need to render that page with a different value for the
  // twitter:card meta tag (see also: HeadTags.tsx, Head.tsx).
  const isSlackBot = userAgent && userAgent.startsWith("Slackbot-LinkExpanding");

  const lastVisitedFrontpage = getCookieFromReq(req, LAST_VISITED_FRONTPAGE_COOKIE);
  // For LW, skip the cache on users who have visited the frontpage before, including logged out. 
  // Doing this so we can show dynamic latest posts list with varying HN decay parameters based on visit frequency (see useractivities/cron.ts).
  const showDynamicFrontpage = !!lastVisitedFrontpage && visitorGetsDynamicFrontpage(user) && url === "/";

  return (
    (!isHealthCheck && (user || isExcludedFromPageCache(url))) ||
    isSlackBot ||
    showDynamicFrontpage
  );
}

function logRequestToConsole(
  req: Request,
  user: DbUser | null,
  tabId: string | null,
  rendered: Exclude<RenderResult, { aborted: true }> & { cached?: boolean }
) {
  const { ip, userAgent, url } = getRequestMetadata(req);

  const userDescription = user?.username ?? `logged out ${ip} (${userAgent})`;

  if (rendered.cached) {
    // eslint-disable-next-line no-console
    console.log(`Served ${url} from cache for ${userDescription}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`Finished SSR of ${url} for ${userDescription}: (${formatTimings(rendered.timings)}, tab ${tabId})`);
  }
}

export const renderWithCache = async (req: Request, res: Response, user: DbUser|null, tabId: string | null, maybePrefetchResources: () => Promise<boolean | undefined>) => {
  const startTime = new Date();
  
  const { ip, userAgent, url } = getRequestMetadata(req);

  const cacheAttempt = !shouldSkipCache(req, user);

  const baseRenderParams = { req, res, startTime, userAgent, url, tabId, ip };
  const cacheSensitiveParams = cacheAttempt
    ? { cacheAttempt }
    : { cacheAttempt: false, user } as const;

  const renderParams: AttemptCachedRenderParams | AttemptNonCachedRenderParams = { ...baseRenderParams, ...cacheSensitiveParams };

  // If the request isn't eligible to hit the page cache, we record a cache bypass
  if (!cacheAttempt) {
    recordCacheBypass({ path: getPathFromReq(req), userAgent: userAgent ?? '' });
  }

  openRenderRequestPerfMetric(renderParams);

  let rendered: RenderResult & { cached?: boolean };
  if (cacheAttempt) {
    rendered = await cachedPageRender(
      req, res, userAgent, maybePrefetchResources,
      // We need the result of `maybePrefetchResources` in both `cachedPageRender` and `queueRenderRequest`
      // In the case where the page is cached, we need to return the result of the promise from `cachedPageRender`
      // In the case where the page is not cached, we need to return the result of the promise from `queueRenderRequest`
      // But we don't want to call `maybePrefetchResources` twice, so we pipe through the promise we get from calling `maybePrefetchResources` in `cachedPageRender`
      (req, prefetchedResources) => queueRenderRequest({ req, res, userAgent, startTime, user: null, cacheAttempt, prefetchedResources })
    );
  } else {
    rendered = await queueRenderRequest({ req, res, userAgent, startTime, user, cacheAttempt, maybePrefetchResources });
  }

  closeRenderRequstPerfMetric(rendered);

  if (rendered.aborted) {
    return rendered;
  }

  logRequestToConsole(req, user, tabId, rendered);
  recordSsrAnalytics(renderParams, rendered);

  return {
    ...rendered,
    headers: [...rendered.headers],
  };
};

let inFlightRenderCount = 0;
const requestPriorityQueue = new PriorityBucketQueue<RenderPriorityQueueSlot>();

/**
 * We (maybe) have a problem where too many concurrently rendering requests cause our servers to fall over
 * To solve this, we introduce a queue for incoming requests, such that we have a maximum number of requests being rendered at the same time
 * See {@link maybeStartQueuedRequests} for the part that kicks off requests when appropriate
 */
function queueRenderRequest(params: RenderRequestParams): Promise<RenderResult> {
  return new Promise((resolve) => {
    requestPriorityQueue.enqueue({
      ip: getClientIP(params.req) ?? "unknown",
      userAgent: params.userAgent ?? 'sus-missing-user-agent',
      userId: params.user?._id,
      callback: async () => {
        let result: RenderResult;
        addStartRenderTimeToPerfMetric();
        try {
          result = await renderRequest(params);
        } finally {
          inFlightRenderCount--;
        }
        resolve(result);
        maybeStartQueuedRequests();
      },
      renderRequestParams: params,
    });

    maybeStartQueuedRequests();
  });
}

function maybeStartQueuedRequests() {
  while (inFlightRenderCount < maxRenderQueueSize.get() && requestPriorityQueue.size() > 0) {
    let requestToStartRendering = requestPriorityQueue.dequeue();
    if (requestToStartRendering.request) {
      const { preOpPriority, request } = requestToStartRendering;
      const { startTime, res } = request.renderRequestParams;
      
      const queuedRequestTimeoutSeconds = queuedRequestTimeoutSecondsSetting.get();
      const maxRequestAge = moment().subtract(queuedRequestTimeoutSeconds, 'seconds').toDate();
      if (maxRequestAge > startTime) {
        trySetResponseStatus({ response: res, status: 429 });
        res.end();
        continue;
      }

      // If the request that we're kicking off is coming from the queue, we want to track this in the perf metrics
      setAsyncStoreValue('requestPerfMetric', (incompletePerfMetric) => {
        if (!incompletePerfMetric) return;
        return {
          ...incompletePerfMetric,
          queue_priority: preOpPriority
        }
      });

      inFlightRenderCount++;
      void request.callback();
    }
  }
}

export function initRenderQueueLogging() {
  if (!isAnyTest && performanceMetricLoggingEnabled.get()) {
    setInterval(logRenderQueueState, 5000)
  }
}

function logRenderQueueState() {
  if (requestPriorityQueue.size() > 0) {
    const queueState = requestPriorityQueue.getQueueState().map(([{ renderRequestParams }, priority]) => {
      return {
        userId: renderRequestParams.user?._id,
        ip: getIpFromRequest(renderRequestParams.req),
        userAgent: renderRequestParams.userAgent,
        url: getPathFromReq(renderRequestParams.req),
        startTime: renderRequestParams.startTime,
        priority
      }
    })

    Vulcan.captureEvent("renderQueueState", {
      queueState
    });
  }
}

function isExcludedFromPageCache(path: string): boolean {
  if (path.startsWith("/collaborateOnPost") || path.startsWith("/editPost")) return true;
  return false
}

const userAgentExclusions = [
  'health',
  'bot',
  'spider',
  'crawler',
  'curl',
  'node',
  'python'
];

function shouldRecordSsrAnalytics(userAgent?: string) {
  if (!userAgent) {
    return true;
  }

  return !userAgentExclusions.some(excludedAgent => userAgent.toLowerCase().includes(excludedAgent));
}

export const getThemeOptionsFromReq = (req: Request, user: DbUser|null): AbstractThemeOptions => {
  const themeCookie = getCookieFromReq(req, "theme");
  return getThemeOptions(themeCookie, user);
}

const buildSSRBody = (htmlContent: string, userAgent?: string) => {
  // When the theme name is "auto", we load the correct style by combining @import url()
  // with prefers-color-scheme (see `renderJssSheetImports`). There's a long-standing
  // Firefox bug where this can cause a flash of unstyled content. For reasons that
  // aren't entirely obvious to me, this can be fixed by adding <script>0</script> as the
  // first child of <body> which forces the browser to load the CSS before rendering.
  // See https://bugzilla.mozilla.org/show_bug.cgi?id=1404468
  const prefix = userAgent?.match(/.*firefox.*/i) ? "<script>0</script>" : "";
  const suffix = commentPermalinkStyleSetting.get() === 'in-context' ? preloadScrollToCommentScript : '';
  // TODO: there should be a cleaner way to set this wrapper
  // id must always match the client side start.jsx file
  return `${prefix}<div id="react-app">${htmlContent}</div>${suffix}`;
}

const renderRequest = async ({req, user, startTime, res, userAgent, ...cacheAttemptParams}: RenderRequestParams): Promise<RenderResult> => {
  let prefetchedResources: Promise<boolean | undefined>;
  if (!cacheAttemptParams.cacheAttempt) {
    // If this is rendering a request for a page that is not cache-eligible,
    // we would not yet have called either ensureClientId or maybePrefetchResources
    // We need to call ensureClientId before:
    // 1. prefetching resources (because that might write to the response, and we need to set the headers before that)
    // 2. computing context (to ensure the clientId is set on the request)
    void ensureClientId(req, res);
    prefetchedResources = cacheAttemptParams.maybePrefetchResources();
  } else {
    // If this is rendering a request for a cache-eligible page that was a cache miss,
    // we would have called ensureClientId and maybePrefetchResources already in `cachedPageRender`
    // We can just use the prefetchedResources that were passed in from `cachedPageRender`, and don't need to call ensureClientId again
    prefetchedResources = cacheAttemptParams.prefetchedResources;
  }

  const cacheFriendly = responseIsCacheable(res);
  const timezone = getCookieFromReq(req, "timezone") ?? DEFAULT_TIMEZONE;

  const requestContext = await computeContextFromUser({user, req, res, isSSR: true});
  if (req.closed) {
    // eslint-disable-next-line no-console
    console.log(`Request for ${req.url} from ${user?._id ?? getIpFromRequest(req)} was closed before render started`);
    return {
      aborted: true,
    };
  }
  configureSentryScope(requestContext);
  
  // according to the Apollo doc, client needs to be recreated on every request
  // this avoids caching server side
  const client = await createClient(requestContext);
  const foreignClient = await createClient(requestContext, true);

  // Used by callbacks to handle side effects
  // E.g storing the stylesheet generated by styled-components
  const context: any = {};

  // Allows components to set statuscodes and redirects that will get executed on the server
  let serverRequestStatus: ServerRequestStatusContextType = {}

  // TODO: req object does not seem to have been processed by the Express
  // middlewares at this point
  // @see https://github.com/meteor/meteor-feature-requests/issues/174#issuecomment-441047495

  // abTestGroups will be given as context for the render, which will modify it
  // (side effects) by filling in any A/B test groups that turned out to be
  // used for the rendering. (Any A/B test group that was *not* relevant to
  // the render will be omitted, which is the point.)
  let abTestGroupsUsed: RelevantTestGroupAllocation = {};
  
  const now = new Date();
  const App = <AppGenerator
    req={req}
    apolloClient={client}
    foreignApolloClient={foreignClient}
    serverRequestStatus={serverRequestStatus}
    abTestGroupsUsed={abTestGroupsUsed}
    ssrMetadata={{renderedAt: now.toISOString(), timezone, cacheFriendly}}
  />;
  
  const themeOptions = getThemeOptionsFromReq(req, user);

  const WrappedApp = wrapWithMuiTheme(App, context, themeOptions);
  
  let htmlContent = '';
  try {
    htmlContent = await renderToStringWithData(WrappedApp);
  } catch(err) {
    console.error(`Error while fetching Apollo Data. date: ${new Date().toString()} url: ${JSON.stringify(getPathFromReq(req))}`); // eslint-disable-line no-console
    console.error(err); // eslint-disable-line no-console
  }
  const afterPrerenderTime = new Date();

  const ssrBody = buildSSRBody(htmlContent, userAgent);

  // add headers using helmet
  const head = ReactDOM.renderToString(<Head userAgent={userAgent}/>);

  // add Apollo state, the client will then parse the string
  const initialState = client.extract();
  const serializedApolloState = embedAsGlobalVar("__APOLLO_STATE__", initialState);
  const serializedForeignApolloState = embedAsGlobalVar("__APOLLO_FOREIGN_STATE__", foreignClient.extract());

  const jssSheets = renderJssSheetImports(themeOptions);

  const finishedTime = new Date();
  const timings: RenderTimings = {
    prerenderTime: afterPrerenderTime.valueOf() - startTime.valueOf(),
    renderTime: finishedTime.valueOf() - afterPrerenderTime.valueOf(),
    totalTime: finishedTime.valueOf() - startTime.valueOf()
  };
  
  // eslint-disable-next-line no-console
  const slowSSRWarnThreshold = slowSSRWarnThresholdSetting.get();
  if (timings.totalTime > slowSSRWarnThreshold) {
    captureException(new Error(`SSR time above ${slowSSRWarnThreshold}ms`), {
      extra: {
        url: getPathFromReq(req),
        ssrTime: timings.totalTime,
      }
    });
  }
  
  client.stop();

  if (cacheFriendly && Object.keys(abTestGroupsUsed).length) {
    const message = `A/B tests used during a render that may be cached externally: ${Object.keys(abTestGroupsUsed).join(", ")}. Defer the A/B test until after SSR or disable caching on this route (\`swrCaching\`)`;
    const url = getPathFromReq(req);
    // eslint-disable-next-line no-console
    console.error(message, {url})
    captureException(new Error(message), {
      extra: { url }
    });
    if (!isProduction) {
      return {aborted: true};
    }
  }

  const clientId = getCookieFromReq(req, "clientId");

  return {
    ssrBody,
    headers: [head],
    serializedApolloState,
    serializedForeignApolloState,
    jssSheets,
    status: serverRequestStatus.status,
    redirectUrl: serverRequestStatus.redirectUrl,
    relevantAbTestGroups: abTestGroupsUsed,
    allAbTestGroups: getAllUserABTestGroups(user ? {user} : {clientId}),
    themeOptions,
    renderedAt: now,
    cacheFriendly,
    timezone,
    timings,
    prefetchedResources,
    aborted: false,
  };
}

const formatTimings = (timings: RenderTimings): string => {
  return `${timings.totalTime}ms`;
}
