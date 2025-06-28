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
import { faviconUrlSetting, isLW, performanceMetricLoggingEnabled } from '@/lib/instanceSettings';
import { isProduction, isE2E } from '@/lib/executionEnvironment';
import { HIDE_IF_ANYONE_BUILDS_IT_SPLASH, LAST_VISITED_FRONTPAGE_COOKIE } from '@/lib/cookies/cookies';
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
import { ResponseForwarderStream, ResponseManager } from '@/server/rendering/ResponseManager';
import { queueRenderRequest } from '@/server/rendering/requestQueue';
import { closeRenderRequestPerfMetric, getCpuTimeMs, logRequestToConsole, openRenderRequestPerfMetric, recordSsrAnalytics, RenderTimings, slowSSRWarnThresholdSetting } from './renderLogging';
import { getIpFromRequest } from '../datadog/datadogMiddleware';
import { HelmetServerState } from 'react-helmet-async';
import every from 'lodash/every';
import { prefilterHandleRequest } from '../apolloServer';
import { HIDE_IF_ANYONE_BUILDS_IT_SPOTLIGHT } from '@/components/themes/useTheme';
import { eventCaptureScript } from './eventCapture';

export interface RenderSuccessResult {
  ssrBody: string
  headers: string
  serializedApolloState: string
  serializedForeignApolloState: string
  structuredData: Record<string,AnyBecauseHard>|null
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
}

interface RenderAbortResult {
  aborted: true;
}

export type RenderResult = RenderSuccessResult | RenderAbortResult;

export interface RenderParams {
  req: Request;
  responseManager: ResponseManager;
  user: DbUser|null;
  startTime: Date;
  userAgent?: string;
  url: string;
  tabId: string|null;
  ip: string;
  cacheAttempt: boolean;
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

  return (user
    || (!isHealthCheck && pathIsExcludedFromPageCache(url))
    || isSlackBot
    || showDynamicFrontpage
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


export async function handleRequest(request: Request, response: Response) {
  if (prefilterHandleRequest(request, response)) {
    return;
  }

  const responseManager = new ResponseManager(response);
  responseManager.setHeader("Content-Type", "text/html; charset=utf-8"); // allows compression
  ensureClientId(request, responseManager.res);

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
  
  const resourcePrefetchOption = parsedRoute.currentRoute?.enableResourcePrefetch
  if (resourcePrefetchOption) {
    if (typeof resourcePrefetchOption === 'function') {
      void (async () => {
        if (await resourcePrefetchOption(request, response, parsedRoute, createAnonymousContext())) {
          responseManager.setStatus(200);
          responseManager.commitToNotUpdateHeaders();
        }
      })();
    } else {
      responseManager.setStatus(200);
      responseManager.commitToNotUpdateHeaders();
    }
  }
  
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
  // FIXME This looks at the response cache-control header but should probably
  // look at the _request_ cache-control heaer instead?
  const tabId = responseIsCacheable(response) ? null : randomId();
  
  const isReturningVisitor = !!getCookieFromReq(request, LAST_VISITED_FRONTPAGE_COOKIE);
  
  // The part of the header which can be sent before the page is rendered.
  // This includes an open tag for <html> and <head> but not the matching
  // close tags, since there's stuff inside that depends on what actually
  // gets rendered. The browser will pick up any references in the still-open
  // tag and start fetching the, without waiting for the closing tag.
  responseManager.setPrefetchHeader(
    jssStylePreload
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
    + eventCaptureScript
    + themeOptionsHeader
  );

  const renderResultPromise = performanceMetricLoggingEnabled.get()
    ? asyncLocalStorage.run({}, () => renderWithCache({req: request, parsedRoute, responseManager, user, tabId}))
    : renderWithCache({req: request, parsedRoute, responseManager, user, tabId});

  const renderResult = await renderResultPromise;

  if (renderResult.aborted || responseManager.isAborted()) {
    trySetResponseStatus({ response, status: 499 });
    response.end();
    return;
  }

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
    responseManager.redirect(status||301, absoluteRedirectUrl);
  } else {
    responseManager.setStatus(status||200);
    const ssrMetadata: SSRMetadata = {
      renderedAt: renderedAt.toISOString(),
      cacheFriendly,
      timezone
    }

    // TODO: Body should be wrapped in <body class={classesForAbTestGroups(allAbTestGroups)}>

    responseManager.addToFooter(
      embedAsGlobalVar("ssrMetadata", ssrMetadata) + '\n'
      + serializedApolloState + '\n'
      + serializedForeignApolloState + '\n'
    );

    if (renderResult.cached) {
      responseManager.addToHeadBlock(renderResult.jssSheets);
      responseManager.addToHeadBlock(renderResult.headers);
      responseManager.addBodyString(renderResult.ssrBody);
      const structuredData = renderResult.structuredData
      if (structuredData) {
        responseManager.setStructuredData(() => structuredData);
      }
    }
  }
  await responseManager.sendAndClose();
}

export const renderWithCache = async ({req, parsedRoute, responseManager, user, tabId}: {
  req: Request,
  parsedRoute: RouterLocation,
  responseManager: ResponseManager,
  user: DbUser|null,
  tabId: string | null,
}) => {
  const startTime = new Date();
  
  const { ip, userAgent, url } = getRequestMetadata(req);

  const cacheAttempt = !shouldSkipCache(req, user);
  const renderParams: RenderParams = { req, responseManager, startTime, userAgent, url, tabId, ip, cacheAttempt, user };

  // If the request isn't eligible to hit the page cache, we record a cache bypass
  if (!cacheAttempt) {
    recordCacheBypass({ path: getPathFromReq(req), userAgent: userAgent ?? '' });
  }

  openRenderRequestPerfMetric(renderParams);

  let rendered: RenderResult & { cached?: boolean };
  if (cacheAttempt) {
    rendered = await cachedPageRender(
      req, responseManager, userAgent,
      // We need the result of `maybePrefetchResources` in both `cachedPageRender` and `queueRenderRequest`
      // In the case where the page is cached, we need to return the result of the promise from `cachedPageRender`
      // In the case where the page is not cached, we need to return the result of the promise from `queueRenderRequest`
      // But we don't want to call `maybePrefetchResources` twice, so we pipe through the promise we get from calling `maybePrefetchResources` in `cachedPageRender`
      () => {
        return queueRenderRequest(
          () => {
            return renderRequest({req, user, parsedRoute, startTime, responseManager, userAgent, cacheAttempt: true});
          },
          { responseManager, userAgent, startTime, userId: null, ip }
        )
      }
    );
  } else {
    rendered = await queueRenderRequest(
      () => renderRequest({req, user, parsedRoute, startTime, responseManager, userAgent, cacheAttempt: true}),
      { responseManager, userAgent, startTime, userId: user?._id ?? null, ip }
    );
  }

  closeRenderRequestPerfMetric(rendered);

  if (rendered.aborted) {
    return rendered;
  }

  logRequestToConsole(req, user, tabId, rendered);
  recordSsrAnalytics(renderParams, rendered);

  return {
    ...rendered,
    headers: rendered.headers,
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


export const renderRequest = async ({req, user, parsedRoute, startTime, responseManager, userAgent }: {
  req: Request,
  responseManager: ResponseManager,
  parsedRoute: RouterLocation
  user: DbUser|null,
  startTime: Date,
  userAgent?: string,
  cacheAttempt: boolean
}): Promise<RenderResult> => {
  const startCpuTime = getCpuTimeMs();
  const startSqlBytesDownloaded = getSqlBytesDownloaded();

  const cacheFriendly = responseIsCacheable(responseManager.res);
  const timezone = getCookieFromReq(req, "timezone") ?? DEFAULT_TIMEZONE;

  const requestContext = await computeContextFromUser({user, req, res: responseManager.res, isSSR: true});
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

  // Hack for the front page If Everyone Builds It announcement
  const hideIfAnyoneBuildsItSplash = getCookieFromReq(req, HIDE_IF_ANYONE_BUILDS_IT_SPLASH)
  const hideIfAnyoneBuildsItSpotlight = getCookieFromReq(req, HIDE_IF_ANYONE_BUILDS_IT_SPOTLIGHT)
  const forceDarkMode = isLW && req.url === '/' && !hideIfAnyoneBuildsItSplash && !hideIfAnyoneBuildsItSpotlight;
  const jssSheets = forceDarkMode
    ? renderJssSheetImports({name: "dark"})
    : renderJssSheetImports(themeOptions);

  responseManager.addToHeadBlock(jssSheets);
  const helmetContext: {helmet?: HelmetServerState} = {};
  
  const renderHeadBlock = () => {
    return ReactDOM.renderToString(<Head userAgent={userAgent} helmetContext={helmetContext}/>);
  }
  
  let headBlockSent = false;
  let asSentHeadBlock: string|null = null;
  const sendHeadBlock = () => {
    if (!headBlockSent) {
      headBlockSent = true;
      const head = renderHeadBlock();
      responseManager.addToHeadBlock(head);
      asSentHeadBlock = head;
      responseManager.commitToNotAddToHeadBlock();
    }
  }
  
  const headBlocksSeen: string[] = [];
  const onHeadBlockSent = (name: string) => {
    if (!headBlocksSeen.includes(name)) {
      headBlocksSeen.push(name);
      const expectedHeadBlocks = parsedRoute.currentRoute?.expectedHeadBlocks
      if (expectedHeadBlocks) {
        if (!expectedHeadBlocks.includes(name)) {
          // eslint-disable-next-line no-console
          console.log(`Page rendered head block ${name} which was not in the route head blocks list`);
        }
        if (every(expectedHeadBlocks, h=>headBlocksSeen.includes(h))) {
          setTimeout(() => {
            sendHeadBlock();
          }, 0);
        }
      }
    }
  }

  const WrappedApp = <body><div id="react-app">
    <AppGenerator
      req={req}
      onHeadBlockSent={onHeadBlockSent}
      responseManager={responseManager}
      apolloClient={client}
      foreignApolloClient={foreignClient}
      serverRequestStatus={serverRequestStatus}
      abTestGroupsUsed={abTestGroupsUsed}
      ssrMetadata={{renderedAt: now.toISOString(), timezone, cacheFriendly}}
      enableSuspense={true}
      themeOptions={themeOptions}
      helmetContext={helmetContext}
    />
  </div></body>

  let ssrBody = '';
  try {
    // TODO: Add prefix/suffix (from buildSSRBody)
    ssrBody = await responseManager.addBodyStream(WrappedApp);
  } catch(err) {
    console.error(`Error while fetching Apollo Data. date: ${new Date().toString()} url: ${JSON.stringify(getPathFromReq(req))}`); // eslint-disable-line no-console
    console.error(err); // eslint-disable-line no-console
  }

  const head = renderHeadBlock();
  sendHeadBlock();
  if (head !== asSentHeadBlock) {
    // eslint-disable-next-line no-console
    console.error(`Head block sent was incorrect`);
  }

  // add Apollo state, the client will then parse the string
  const initialState = client.extract();
  const serializedApolloState = embedAsGlobalVar("__APOLLO_STATE__", initialState);
  const serializedForeignApolloState = embedAsGlobalVar("__APOLLO_FOREIGN_STATE__", foreignClient.extract());

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

  const clientId = req.clientId!;

  return {
    ssrBody,
    headers: head,
    serializedApolloState,
    serializedForeignApolloState,
    structuredData: responseManager.getStructuredData(),
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
    aborted: false,
  };
}

