/**
 * Render the page server side
 * @see https://github.com/szomolanyi/MeteorApolloStarter/blob/master/imports/startup/server/ssr.js
 * @see https://github.com/apollographql/GitHunt-React/blob/master/src/server.js
 * @see https://www.apollographql.com/docs/react/features/server-side-rendering.html#renderToStringWithData
 */
import React from 'react';
import ReactDOM, { renderToPipeableStream } from 'react-dom/server';
import { renderToStringWithData } from '@apollo/client/react/ssr';
import { getUserFromReq, computeContextFromUser, configureSentryScope } from '@/server/vulcan-lib/apollo-server/context';
import { createClient } from '@/server/vulcan-lib/apollo-ssr/apolloClient';
import { cachedPageRender, recordCacheBypass} from './pageCache';
import { getAllUserABTestGroups, CompleteTestGroupAllocation, RelevantTestGroupAllocation, classesForAbTestGroups } from '@/lib/abTestImpl';
import Head from './Head';
import { embedAsGlobalVar, healthCheckUserAgentSetting } from './renderUtil';
import AppGenerator from '@/server/vulcan-lib/apollo-ssr/components/AppGenerator';
import { captureException } from '@sentry/core';
import { ServerRequestStatusContextType, parseRoute, parsePath } from '@/lib/vulcan-core/appContext';
import { getCookieFromReq, getPathFromReq, getRequestMetadata, trySetResponseStatus } from '@/server/utils/httpUtil';
import { getThemeOptions, AbstractThemeOptions } from '@/themes/themeNames';
import { renderJssSheetImports, renderJssSheetPreloads } from '@/server/utils/renderJssSheetImports';
import type { Request, Response } from 'express';
import { DEFAULT_TIMEZONE, SSRMetadata } from '@/lib/utils/timeUtil';
import { asyncLocalStorage } from '@/server/perfMetrics';
import { commentPermalinkStyleSetting } from '@/lib/publicSettings';
import { faviconUrlSetting, performanceMetricLoggingEnabled } from '@/lib/instanceSettings';
import { isProduction, isE2E } from '@/lib/executionEnvironment';
import { LAST_VISITED_FRONTPAGE_COOKIE } from '@/lib/cookies/cookies';
import { visitorGetsDynamicFrontpage } from '@/lib/betas';
import { responseIsCacheable } from '@/server/cacheControlMiddleware';
import { preloadScrollToCommentScript } from '@/lib/scrollUtils';
import { ensureClientId } from '@/server/clientIdMiddleware';
import { getSqlBytesDownloaded } from '@/server/sqlConnection';
import { measureSqlBytesDownloaded } from '@/server/sql/sqlClient';
import { globalExternalStylesheets } from '@/themes/globalStyles/externalStyles';
import { getPublicSettings, getPublicSettingsLoaded } from '@/lib/settingsCache';
import { randomId } from '@/lib/random';
import { getClientBundle } from '@/server/utils/bundleUtils';
import { getInstanceSettings } from '@/lib/getInstanceSettings';
import { makeAbsolute, urlIsAbsolute } from '@/lib/vulcan-lib/utils';
import type { RouterLocation } from '@/lib/vulcan-lib/routes';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import express from 'express'
import { ResponseForwarderStream } from '@/server/rendering/ResponseManager';
import { queueRenderRequest } from '@/server/rendering/requestQueue';
import { closeRenderRequestPerfMetric, getCpuTimeMs, logRequestToConsole, openRenderRequestPerfMetric, recordSsrAnalytics, RenderTimings, slowSSRWarnThresholdSetting } from './renderLogging';
import { getIpFromRequest } from '../datadog/datadogMiddleware';
import { HelmetServerState } from 'react-helmet-async';

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
  isStreaming: boolean
}

export type RenderRequestParams = BaseRenderRequestParams & (CacheMissParams | CacheSkipParams);

export interface AttemptCachedRenderParams {
  req: Request;
  res: Response;
  startTime: Date;
  userAgent?: string;
  url: string;
  tabId: string|null;
  ip: string;
  cacheAttempt: true;
}

export interface AttemptNonCachedRenderParams {
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
    (!isHealthCheck && (user || pathIsExcludedFromPageCache(url))) ||
    isSlackBot ||
    showDynamicFrontpage
  );
}

function pathIsExcludedFromPageCache(path: string): boolean {
  if (path.startsWith("/collaborateOnPost") || path.startsWith("/editPost")) return true;
  return false
}


/** {{{
 * End-to-end tests automate interactions with the page. If we try to, for
 * instance, click on a button before the page has been hydrated then the "click"
 * will occur but nothing will happen as the event listener won't be attached
 * yet which leads to flaky tests. To avoid this we add some static styles to
 * the top of the SSR'd page which are then manually deleted _after_ React
 * hydration has finished. Be careful editing this - it would ve very bad for
 * this to end up in production builds.
 */
const ssrInteractionDisable = isE2E
  ? `
    <style id="ssr-interaction-disable">
      #react-app * {
        display: none;
      }
    </style>
  `
  : "";
//}}}

/**
 * If allowed, write the prefetchPrefix to the response so the client can start downloading resources
 */
const maybePrefetchResources = ({
  request,
  response,
  parsedRoute,
  prefetchPrefix
}: {
  request: express.Request;
  response: express.Response;
  parsedRoute: RouterLocation,
  prefetchPrefix: string;
}) => {

  const maybeWritePrefetchedResourcesToResponse = async () => {
    const enableResourcePrefetch = parsedRoute.currentRoute?.enableResourcePrefetch;
    const prefetchResources =
      typeof enableResourcePrefetch === "function"
        ? await enableResourcePrefetch(request, response, parsedRoute, createAnonymousContext())
        : enableResourcePrefetch;

    if (prefetchResources) {
      response.setHeader("X-Accel-Buffering", "no"); // force nginx to send start of response immediately
      trySetResponseStatus({ response, status: 200 });
      response.write(prefetchPrefix);
    }
    return prefetchResources;
  };

  return maybeWritePrefetchedResourcesToResponse;
};


export async function handleRequest(request: Request, response: Response) {
  response.setHeader("Content-Type", "text/html; charset=utf-8"); // allows compression

  if (!getPublicSettingsLoaded()) throw Error('Failed to render page because publicSettings have not yet been initialized on the server')
  const publicSettingsHeader = embedAsGlobalVar("publicSettings", getPublicSettings())

  const bundleHash = getClientBundle().resource.hash;
  const clientScript = enableVite
    ? ""
    : `<script async src="/js/bundle.js?hash=${bundleHash}"></script>`
  const instanceSettingsHeader = embedAsGlobalVar("publicInstanceSettings", getInstanceSettings().public);

  // Check whether the requested route has enableResourcePrefetch. If it does,
  // we send HTTP status and headers early, before we actually rendered the
  // page, so that the browser can get started on loading the stylesheet and
  // JS bundle while SSR is still in progress.
  const parsedRoute = parseRoute({
    location: parsePath(request.url)
  });
  
  const user = getUserFromReq(request);
  const themeOptions = getThemeOptionsFromReq(request, user);
  const themeOptionsHeader = embedAsGlobalVar("themeOptions", themeOptions);
  const jssStylePreload = renderJssSheetPreloads(themeOptions);
  const externalStylesPreload = globalExternalStylesheets.map(url =>
    `<link rel="stylesheet" type="text/css" href="${url}">`
  ).join("");
  
  const faviconHeader = `<link rel="shortcut icon" href="${faviconUrlSetting.get()}"/>`;

  // Inject a tab ID into the page, by injecting a script fragment that puts
  // it into a global variable. If the response is cacheable (same html may be used
  // by multiple tabs), this is generated in `clientStartup.ts` instead.
  const tabId = responseIsCacheable(response) ? null : randomId();
  
  const jssSheetImports = renderJssSheetImports(themeOptions);
  
  const isReturningVisitor = !!getCookieFromReq(request, LAST_VISITED_FRONTPAGE_COOKIE);

  // The part of the header which can be sent before the page is rendered.
  // This includes an open tag for <html> and <head> but not the matching
  // close tags, since there's stuff inside that depends on what actually
  // gets rendered. The browser will pick up any references in the still-open
  // tag and start fetching the, without waiting for the closing tag.
  const prefetchPrefix = (
    '<!doctype html>\n'
    + '<html lang="en">\n'
    + '<head>\n'
      + jssStylePreload
      + externalStylesPreload
      + ssrInteractionDisable
      + instanceSettingsHeader
      + faviconHeader
      // Embedded script tags that must precede the client bundle
      + publicSettingsHeader
      + embedAsGlobalVar("tabId", tabId)
      + embedAsGlobalVar("isReturningVisitor", isReturningVisitor)
      // The client bundle. Because this uses <script async>, its load order
      // relative to any scripts that come later than this is undetermined and
      // varies based on timings and the browser cache.
      + clientScript
      + themeOptionsHeader
  );
  
  const isStreaming = !!parsedRoute.currentRoute?.enableSuspenseStreaming;

  // Note: this may write to the response
  let prefetchResourcesPromise = maybePrefetchResources({ request, response, parsedRoute, prefetchPrefix });
  
  if (isStreaming) {
    await prefetchResourcesPromise();
    prefetchResourcesPromise = async () => true
    response.write(jssSheetImports + "</head>");
  }

  const renderResultPromise = performanceMetricLoggingEnabled.get()
    ? asyncLocalStorage.run({}, () => renderWithCache(request, response, user, tabId, prefetchResourcesPromise, isStreaming))
    : renderWithCache(request, response, user, tabId, prefetchResourcesPromise, isStreaming);

  const renderResult = await renderResultPromise;

  if (renderResult.aborted) {
    trySetResponseStatus({ response, status: 499 });
    response.end();
    return;
  }

  const prefetchingResources = await renderResult.prefetchedResources;

  const {
    ssrBody,
    headers,
    serializedApolloState,
    serializedForeignApolloState,
    jssSheets,
    status,
    redirectUrl,
    renderedAt,
    timezone,
    cacheFriendly,
    allAbTestGroups,
  } = renderResult;
  
  // Finally send generated HTML with initial data to the client
  if (redirectUrl) {
    // eslint-disable-next-line no-console
    console.log(`Redirecting to ${redirectUrl}`);
    const absoluteRedirectUrl = urlIsAbsolute(redirectUrl) ? redirectUrl : makeAbsolute(redirectUrl);
    trySetResponseStatus({ response, status: status || 301 }).redirect(absoluteRedirectUrl);
  } else {
    trySetResponseStatus({ response, status: status || 200 });
    const ssrMetadata: SSRMetadata = {
      renderedAt: renderedAt.toISOString(),
      cacheFriendly,
      timezone
    }

    if (!isStreaming) {
      response.write(
        (prefetchingResources ? '' : prefetchPrefix)
          + headers.join('\n')
          + themeOptionsHeader
          + jssSheets
        + '</head>\n'
        + '<body class="'+classesForAbTestGroups(allAbTestGroups)+'">\n'
          + ssrBody + '\n'
        + '</body>\n'
      );
    }

    response.write(
      embedAsGlobalVar("ssrRenderedAt", renderedAt) + '\n' // TODO Remove after 2024-05-14, here for backwards compatibility
      + embedAsGlobalVar("ssrMetadata", ssrMetadata) + '\n'
      + serializedApolloState + '\n'
      + serializedForeignApolloState + '\n'
      + '</html>\n')
    response.end();
  }
}

export const renderWithCache = async (req: Request, res: Response, user: DbUser|null, tabId: string | null, maybePrefetchResources: () => Promise<boolean | undefined>, isStreaming: boolean) => {
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
      (req, prefetchedResources) => queueRenderRequest({ req, res, userAgent, startTime, user: null, cacheAttempt, prefetchedResources, isStreaming })
    );
  } else {
    rendered = await queueRenderRequest({ req, res, userAgent, startTime, user, cacheAttempt, maybePrefetchResources, isStreaming });
  }

  closeRenderRequestPerfMetric(rendered);

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
  return `${prefix}${htmlContent}${suffix}`;
}


export const renderRequest = async ({req, user, startTime, res, userAgent, isStreaming, ...cacheAttemptParams}: RenderRequestParams): Promise<RenderResult> => {
  const startCpuTime = getCpuTimeMs();
  const startSqlBytesDownloaded = getSqlBytesDownloaded();

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
  const themeOptions = getThemeOptionsFromReq(req, user);
  const helmetContext: {helmet?: HelmetServerState} = {};

  const WrappedApp = <div id="react-app">
    <AppGenerator
      req={req}
      apolloClient={client}
      foreignApolloClient={foreignClient}
      serverRequestStatus={serverRequestStatus}
      abTestGroupsUsed={abTestGroupsUsed}
      ssrMetadata={{renderedAt: now.toISOString(), timezone, cacheFriendly}}
      enableSuspense={isStreaming}
      themeOptions={themeOptions}
      helmetContext={helmetContext}
    />
  </div>

  let htmlContent = '';
  try {
    if (isStreaming) {
      const stream = new ResponseForwarderStream({res, corked: false});
      await new Promise<void>((resolve) => {
        const reactPipe = renderToPipeableStream(WrappedApp, {
          onAllReady: () => {
            resolve();
          },
        });
        reactPipe.pipe(stream);
      });
      htmlContent = "";
      //htmlContent = stream.getString();
    } else {
      htmlContent = await renderToStringWithData(WrappedApp);
    }
  } catch(err) {
    console.error(`Error while fetching Apollo Data. date: ${new Date().toString()} url: ${JSON.stringify(getPathFromReq(req))}`); // eslint-disable-line no-console
    console.error(err); // eslint-disable-line no-console
  }

  const ssrBody = buildSSRBody(htmlContent, userAgent);

  // add headers using helmet
  const head = ReactDOM.renderToString(<Head userAgent={userAgent} helmetContext={helmetContext}/>);

  // add Apollo state, the client will then parse the string
  const initialState = client.extract();
  const serializedApolloState = embedAsGlobalVar("__APOLLO_STATE__", initialState);
  const serializedForeignApolloState = embedAsGlobalVar("__APOLLO_FOREIGN_STATE__", foreignClient.extract());

  const jssSheets = renderJssSheetImports(themeOptions);

  const finishedTime = new Date();
  const finishedCpuTime = getCpuTimeMs();
  const timings: RenderTimings = {
    wallTime: finishedTime.valueOf() - startTime.valueOf(),
    cpuTime: finishedCpuTime - startCpuTime,
    ...(measureSqlBytesDownloaded ? {sqlBytesDownloaded: getSqlBytesDownloaded() - startSqlBytesDownloaded} : {}),
  };
  
  // eslint-disable-next-line no-console
  const slowSSRWarnThreshold = slowSSRWarnThresholdSetting.get();
  if (timings.wallTime > slowSSRWarnThreshold) {
    captureException(new Error(`SSR time above ${slowSSRWarnThreshold}ms`), {
      extra: {
        url: getPathFromReq(req),
        ssrTime: timings.wallTime,
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

