import { getCookieFromReq, getRequestMetadata } from '@/server/utils/httpUtil';
import type { Request } from 'express';
import { closeRequestPerfMetric, openPerfMetric, setAsyncStoreValue } from '@/server/perfMetrics';
import { performanceMetricLoggingEnabled } from '@/lib/instanceSettings';
import { getClientIP } from '@/server/utils/getClientIP';
import { captureEvent } from '@/lib/analyticsEvents';
import { type RenderParams, RenderResult } from './renderPage';
import { requestToNextRequest } from '../apolloServer';


export type RenderTimings = {
  wallTime: number
  cpuTime: number
  sqlBytesDownloaded?: number
}


export function openRenderRequestPerfMetric(renderParams: RenderParams) {
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
    ip: getClientIP(requestToNextRequest(req).headers),
    user_agent: userAgent,
    ...userIdField,
  }, startTime);

  setAsyncStoreValue('requestPerfMetric', perfMetric);
}

export function closeRenderRequestPerfMetric(rendered: RenderResult & { cached?: boolean }) {
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

export function recordSsrAnalytics(
  params: RenderParams,
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

  captureEvent("ssr", {
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

export function logRequestToConsole(
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

const ssrAnalyticsUserAgentExclusions = [
  'health',
  'bot',
  'spider',
  'crawler',
  'curl',
  'node',
  'python'
];

export function shouldRecordSsrAnalytics(userAgent?: string) {
  if (!userAgent) {
    return true;
  }

  return !ssrAnalyticsUserAgentExclusions.some(excludedAgent => userAgent.toLowerCase().includes(excludedAgent));
}

export const formatTimings = (timings: RenderTimings): string => {
  return `${timings.wallTime}ms`;
}

export const getCpuTimeMs = (): number => {
  const cpuUsage = process.cpuUsage();
  return (cpuUsage.system + cpuUsage.user) / 1000.0;
}
