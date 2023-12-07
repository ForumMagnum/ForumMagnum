import { v4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

import { queuePerfMetric } from './analyticsWriter';
import type { Request, Response, NextFunction } from 'express';
import { performanceMetricLoggingEnabled } from '../lib/publicSettings';
import { getForwardedWhitelist } from './forwarded_whitelist';

type IncompletePerfMetricProps = Pick<PerfMetric, 'op_type' | 'op_name' | 'parent_trace_id' | 'extra_data' | 'client_path' | 'gql_string' | 'ip' | 'user_agent'>;

export const asyncLocalStorage = new AsyncLocalStorage<Map<'context', ResolverContext>>();

export function generateTraceId() {
  return v4();
}

export function openPerfMetric(props: IncompletePerfMetricProps, startedAtOverride?: Date): IncompletePerfMetric {
  return {
    ...props,
    started_at: startedAtOverride ?? new Date(),
    trace_id: v4(),
  };
}

export function closePerfMetric(openPerfMetric: IncompletePerfMetric) {
  const perfMetric = {
    ...openPerfMetric,
    ended_at: new Date()
  };

  queuePerfMetric(perfMetric);
}

export function perfMetricMiddleware(req: Request, res: Response, next: NextFunction) {
  if (performanceMetricLoggingEnabled.get()) {
    const perfMetric = openPerfMetric({
      op_type: 'request',
      op_name: req.originalUrl,
      client_path: req.headers['request-origin-path'] as string,
      ip: getForwardedWhitelist().getClientIP(req),
      user_agent: req.headers["user-agent"]
    });

    Object.assign(req, { perfMetric });
    res.on('finish', () => {
      closePerfMetric(perfMetric);
    });
  }
  // TODO: forum-gate this
  asyncLocalStorage.run<void, []>(new Map(), next);
  // next();
}
