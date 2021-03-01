/**
 * Render the page server side
 * @see https://github.com/szomolanyi/MeteorApolloStarter/blob/master/imports/startup/server/ssr.js
 * @see https://github.com/apollographql/GitHunt-React/blob/master/src/server.js
 * @see https://www.apollographql.com/docs/react/features/server-side-rendering.html#renderToStringWithData
 */
import React from 'react';
import ReactDOM from 'react-dom/server';
import { renderToStringWithData } from '@apollo/client/react/ssr';
import { getUserFromReq, computeContextFromUser } from '../apollo-server/context';

import { wrapWithMuiTheme } from '../../material-ui/themeProvider';
import { Vulcan } from '../../../lib/vulcan-lib/config';
import { createClient } from './apolloClient';
import { cachedPageRender, recordCacheBypass} from './pageCache';
import { getAllUserABTestGroups, CompleteTestGroupAllocation, RelevantTestGroupAllocation } from '../../../lib/abTestImpl';
import Head from './components/Head';
import { embedAsGlobalVar } from './renderUtil';
import AppGenerator from './components/AppGenerator';
import { captureException } from '@sentry/core';
import { randomId } from '../../../lib/random';
import { getPublicSettings, getPublicSettingsLoaded } from '../../../lib/settingsCache'
import { getMergedStylesheet } from '../../styleGeneration';
import { ServerRequestStatusContextType } from '../../../lib/vulcan-core/appContext';
import { getCookieFromReq, getPathFromReq } from '../../utils/httpUtil';
import { isValidSerializedThemeOptions, ThemeOptions } from '../../../themes/themeNames';
import type { Request, Response } from 'express';

type RenderTimings = {
  totalTime: number
  prerenderTime: number
  renderTime: number
}

export type RenderResult = {
  ssrBody: string
  headers: Array<string>
  serializedApolloState: string
  jssSheets: string
  status: number|undefined,
  redirectUrl: string|undefined
  relevantAbTestGroups: RelevantTestGroupAllocation
  allAbTestGroups: CompleteTestGroupAllocation
  themeOptions: ThemeOptions,
  timings: RenderTimings
}

export const renderWithCache = async (req: Request, res: Response) => {
  const startTime = new Date();
  const user = await getUserFromReq(req);
  
  const ip = req.headers["x-real-ip"] || req.headers['x-forwarded-for'];
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
  
  if (user) {
    // When logged in, don't use the page cache (logged-in pages have notifications and stuff)
    recordCacheBypass();
    //eslint-disable-next-line no-console
    const rendered = await renderRequest({
      req, user, startTime, res, clientId,
    });
    Vulcan.captureEvent("ssr", {
      ...ssrEventParams,
      userId: user._id,
      timings: rendered.timings,
      cached: false,
      abTestGroups: rendered.allAbTestGroups,
    });
    // eslint-disable-next-line no-console
    console.log(`Rendered ${url} for ${user.username}: ${printTimings(rendered.timings)}`);
    
    return {
      ...rendered,
      headers: [...rendered.headers, tabIdHeader, publicSettingsHeader],
    };
  } else {
    const abTestGroups = getAllUserABTestGroups(user, clientId);
    const rendered = await cachedPageRender(req, abTestGroups, (req: Request) => renderRequest({
      req, user: null, startTime, res, clientId,
    }));
    
    if (rendered.cached) {
      // eslint-disable-next-line no-console
      console.log(`Served ${url} from cache for logged out ${ip} (${userAgent})`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Rendered ${url} for logged out ${ip}: ${printTimings(rendered.timings)} (${userAgent})`);
    }
    
    Vulcan.captureEvent("ssr", {
      ...ssrEventParams,
      userId: null,
      timings: {
        totalTime: new Date().valueOf()-startTime.valueOf(),
      },
      abTestGroups: rendered.relevantAbTestGroups,
      cached: rendered.cached,
    });
    
    return {
      ...rendered,
      headers: [...rendered.headers, tabIdHeader, publicSettingsHeader],
    };
  }
};

export const renderRequest = async ({req, user, startTime, res, clientId}: {
  req: Request,
  user: DbUser|null,
  startTime: Date,
  res: Response,
  clientId: string,
}): Promise<RenderResult> => {
  const requestContext = await computeContextFromUser(user, req, res);
  // according to the Apollo doc, client needs to be recreated on every request
  // this avoids caching server side
  const client = await createClient(requestContext);

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
  
  const App = <AppGenerator
    req={req} apolloClient={client}
    serverRequestStatus={serverRequestStatus}
    abTestGroupsUsed={abTestGroups}
  />;

  const serializedThemeOptions = (user?.theme && isValidSerializedThemeOptions(user.theme)) ? user.theme : '{"name":"default"}';
  const themeOptions = JSON.parse(serializedThemeOptions) as ThemeOptions

  const WrappedApp = wrapWithMuiTheme(App, context, themeOptions);
  
  let htmlContent = '';
  try {
    htmlContent = await renderToStringWithData(WrappedApp);
  } catch(err) {
    console.error(`Error while fetching Apollo Data. date: ${new Date().toString()} url: ${JSON.stringify(getPathFromReq(req))}`); // eslint-disable-line no-console
    console.error(err); // eslint-disable-line no-console
  }
  const afterPrerenderTime = new Date();

  // TODO: there should be a cleaner way to set this wrapper
  // id must always match the client side start.jsx file
  const ssrBody = `<div id="react-app">${htmlContent}</div>`;

  // add headers using helmet
  const head = ReactDOM.renderToString(<Head />);

  // add Apollo state, the client will then parse the string
  const initialState = client.extract();
  const serializedApolloState = embedAsGlobalVar("__APOLLO_STATE__", initialState);
  
  // HACK: The sheets registry was created in wrapWithMuiTheme and added to the
  // context.
  const sheetsRegistry = context.sheetsRegistry;
  const jssSheets = `<style id="jss-server-side">${sheetsRegistry.toString()}</style>`
    +'<style id="jss-insertion-point"></style>'
    +`<link rel="stylesheet" onerror="window.missingMainStylesheet=true" href="${getMergedStylesheet(themeOptions).url}">`
  
  const finishedTime = new Date();
  const timings: RenderTimings = {
    prerenderTime: afterPrerenderTime.valueOf() - startTime.valueOf(),
    renderTime: finishedTime.valueOf() - afterPrerenderTime.valueOf(),
    totalTime: finishedTime.valueOf() - startTime.valueOf()
  };
  
  // eslint-disable-next-line no-console
  if (timings.totalTime > 3000) {
    captureException(new Error("SSR time above 3 seconds"));
  }
  
  return {
    ssrBody,
    headers: [head],
    serializedApolloState, jssSheets,
    status: serverRequestStatus.status,
    redirectUrl: serverRequestStatus.redirectUrl,
    relevantAbTestGroups: abTestGroups,
    allAbTestGroups: getAllUserABTestGroups(user, clientId),
    themeOptions: themeOptions,
    timings,
  };
}

const printTimings = (timings: RenderTimings): string => {
  return `${timings.totalTime}ms (prerender: ${timings.prerenderTime}ms, render: ${timings.renderTime}ms)`;
}
