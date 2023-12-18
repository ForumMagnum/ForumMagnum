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
import { randomId } from '../../../lib/random';
import { getPublicSettings, getPublicSettingsLoaded } from '../../../lib/settingsCache'
import { ServerRequestStatusContextType } from '../../../lib/vulcan-core/appContext';
import { getCookieFromReq, getPathFromReq } from '../../utils/httpUtil';
import { getThemeOptions, AbstractThemeOptions } from '../../../themes/themeNames';
import { renderJssSheetImports } from '../../utils/renderJssSheetImports';
import { DatabaseServerSetting } from '../../databaseSettings';
import type { Request, Response } from 'express';
import type { TimeOverride } from '../../../lib/utils/timeUtil';
import { getIpFromRequest } from '../../datadog/datadogMiddleware';
import { isLWorAF } from '../../../lib/instanceSettings';
import { maxRenderQueueSize, performanceMetricLoggingEnabled } from '../../../lib/publicSettings';
import { closePerfMetric, openPerfMetric } from '../../perfMetrics';
import { getForwardedWhitelist } from '../../forwarded_whitelist';

const slowSSRWarnThresholdSetting = new DatabaseServerSetting<number>("slowSSRWarnThreshold", 3000);

type RenderTimings = {
  totalTime: number
  prerenderTime: number
  renderTime: number
}

export type RenderResult = {
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
  timings: RenderTimings
}

interface RenderRequestParams {
  req: Request,
  user: DbUser|null,
  startTime: Date,
  res: Response,
  clientId: string,
  userAgent?: string,
}

interface RenderQueueSlot {
  callback: () => Promise<void>
}

export const renderWithCache = async (req: Request, res: Response, user: DbUser|null) => {
  const startTime = new Date();
  
  const ip = getIpFromRequest(req)
  const userAgent = req.headers["user-agent"];
  
  // Inject a tab ID into the page, by injecting a script fragment that puts
  // it into a global variable. In previous versions of Vulcan this would've
  // been handled by InjectData, but InjectData didn't surive the 1.12 version
  // upgrade (it injects into the page template in a way that requires a
  // response object, which the onPageLoad/sink API doesn't offer).
  const tabId = randomId();
  const tabIdHeader = `<script>var tabId = "${tabId}"</script>`;
  const url = getPathFromReq(req);
  
  const clientId = getCookieFromReq(req, "clientId");

  if (!getPublicSettingsLoaded()) throw Error('Failed to render page because publicSettings have not yet been initialized on the server')
  const publicSettingsHeader = `<script> var publicSettings = ${JSON.stringify(getPublicSettings())}</script>`
  
  const ssrEventParams = {
    url: url,
    clientId, tabId,
    userAgent: userAgent,
  };

  const isHealthCheck = userAgent === healthCheckUserAgentSetting.get();
  const abTestGroups = getAllUserABTestGroups(user ? {user} : {clientId});
  
  // Skip the page-cache if the user-agent is Slackbot's link-preview fetcher
  // because we need to render that page with a different value for the
  // twitter:card meta tag (see also: HeadTags.tsx, Head.tsx).
  const isSlackBot = userAgent && userAgent.startsWith("Slackbot-LinkExpanding");
  
  if ((!isHealthCheck && (user || isExcludedFromPageCache(url, abTestGroups))) || isSlackBot) {
    // When logged in, don't use the page cache (logged-in pages have notifications and stuff)
    recordCacheBypass({path: getPathFromReq(req), userAgent: userAgent ?? ''});
    //eslint-disable-next-line no-console
    const rendered = await queueRenderRequest({
      req, user, startTime, res, clientId, userAgent,
    });

    if (performanceMetricLoggingEnabled.get()) {
      const perfMetric = openPerfMetric({
        op_type: "ssr",
        op_name: "skipCache",
        client_path: req.originalUrl,
        //we compute ip via two different methods in the codebase, using this one to be consistent with other perf_metrics
        ip: getForwardedWhitelist().getClientIP(req),
        user_agent: userAgent
      }, startTime)      

      closePerfMetric(perfMetric)
    }

    if (shouldRecordSsrAnalytics(ssrEventParams.userAgent)) {
      Vulcan.captureEvent("ssr", {
        ...ssrEventParams,
        userId: user?._id,
        timings: rendered.timings,
        cached: false,
        abTestGroups: rendered.allAbTestGroups,
        ip
      });
    }

    // eslint-disable-next-line no-console
    console.log(`Rendered ${url} for ${user?.username ?? `logged out ${ip}`}: ${printTimings(rendered.timings)}`);
    
    return {
      ...rendered,
      headers: [...rendered.headers, tabIdHeader, publicSettingsHeader],
    };
  } else {
    const rendered = await cachedPageRender(req, abTestGroups, userAgent, (req: Request) => queueRenderRequest({
      req, user: null, startTime, res, clientId, userAgent
    }));
    
    if (rendered.cached) {
      // eslint-disable-next-line no-console
      console.log(`Served ${url} from cache for logged out ${ip} (${userAgent})`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Rendered ${url} for logged out ${ip}: ${printTimings(rendered.timings)} (${userAgent})`);
    }

    if (performanceMetricLoggingEnabled.get()) {
      const perfMetric = openPerfMetric({
        op_type: "ssr",
        op_name: rendered.cached ? "cacheHit" : "cacheMiss",
        client_path: req.originalUrl,
        //we compute ip via two different methods in the codebase, using this one to be consistent with other perf_metrics
        ip: getForwardedWhitelist().getClientIP(req),
        user_agent: userAgent
      }, startTime)      

      closePerfMetric(perfMetric)
    }

    if (shouldRecordSsrAnalytics(ssrEventParams.userAgent)) {
      Vulcan.captureEvent("ssr", {
        ...ssrEventParams,
        userId: null,
        timings: {
          totalTime: new Date().valueOf()-startTime.valueOf(),
        },
        abTestGroups: rendered.allAbTestGroups,
        cached: rendered.cached,
        ip
      });
    }
    
    return {
      ...rendered,
      headers: [...rendered.headers, tabIdHeader, publicSettingsHeader],
    };
  }
};

let inFlightRenderCount = 0;
const requestQueue: RenderQueueSlot[] = [];

/**
 * We (maybe) have a problem where too many concurrently rendering requests cause our servers to fall over
 * To solve this, we introduce a queue for incoming requests, such that we have a maximum number of requests being rendered at the same time
 * See {@link maybeStartQueuedRequests} for the part that kicks off requests when appropriate
 */
function queueRenderRequest(params: RenderRequestParams): Promise<RenderResult> {
  return new Promise((resolve) => {
    requestQueue.push({
      callback: async () => {
        let result: RenderResult;
        try {
          result = await renderRequest(params);
        } finally {
          inFlightRenderCount--;
        }
        resolve(result);
        maybeStartQueuedRequests();
      }
    });

    maybeStartQueuedRequests();
  });
}

function maybeStartQueuedRequests() {
  while (inFlightRenderCount < maxRenderQueueSize.get() && requestQueue.length > 0) {
    let requestToStartRendering = requestQueue.shift();
    if (requestToStartRendering) {
      inFlightRenderCount++;
      void requestToStartRendering.callback();
    }
  }
}

function isExcludedFromPageCache(path: string, abTestGroups: CompleteTestGroupAllocation): boolean {
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
  // TODO: there should be a cleaner way to set this wrapper
  // id must always match the client side start.jsx file
  return `${prefix}<div id="react-app">${htmlContent}</div>`;
}

const renderRequest = async ({req, user, startTime, res, clientId, userAgent}: RenderRequestParams): Promise<RenderResult> => {
  const requestContext = await computeContextFromUser(user, req, res);
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
  let abTestGroups: RelevantTestGroupAllocation = {};
  
  const now = new Date();
  const timeOverride: TimeOverride = {currentTime: now};
  const App = <AppGenerator
    req={req}
    apolloClient={client}
    foreignApolloClient={foreignClient}
    serverRequestStatus={serverRequestStatus}
    abTestGroupsUsed={abTestGroups}
    timeOverride={timeOverride}
  />;
  
  const themeOptions = getThemeOptionsFromReq(req, user);
  const jssSheetsPromise = renderJssSheetImports(themeOptions);

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

  const jssSheets = await jssSheetsPromise;

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

  return {
    ssrBody,
    headers: [head],
    serializedApolloState,
    serializedForeignApolloState,
    jssSheets,
    status: serverRequestStatus.status,
    redirectUrl: serverRequestStatus.redirectUrl,
    relevantAbTestGroups: abTestGroups,
    allAbTestGroups: getAllUserABTestGroups(user ? {user} : {clientId}),
    themeOptions,
    renderedAt: now,
    timings,
  };
}

const printTimings = (timings: RenderTimings): string => {
  return `${timings.totalTime}ms (prerender: ${timings.prerenderTime}ms, render: ${timings.renderTime}ms)`;
}
