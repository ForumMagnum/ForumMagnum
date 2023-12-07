import { v4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

import { queuePerfMetric } from './analyticsWriter';
import type { Request, Response, NextFunction } from 'express';
import { performanceMetricLoggingEnabled } from '../lib/publicSettings';
import { getForwardedWhitelist } from './forwarded_whitelist';

type IncompletePerfMetricProps = Pick<PerfMetric, 'op_type' | 'op_name' | 'parent_trace_id' | 'extra_data' | 'client_path' | 'gql_string' | 'ip' | 'user_agent'>;

interface AsyncLocalStorageContext {
  resolverContext?: ResolverContext;
  requestPerfMetric?: IncompletePerfMetric;
}

export const asyncLocalStorage = new AsyncLocalStorage<AsyncLocalStorageContext>();

export function setStoreValue<T extends keyof AsyncLocalStorageContext>(key: T, value: AsyncLocalStorageContext[T] | ((previousValue: AsyncLocalStorageContext[T]) => AsyncLocalStorageContext[T])) {
  const store = asyncLocalStorage.getStore();
  if (store) {
    if (typeof value === 'function') {
      store[key] = value(store[key]);
    } else {
      store[key] = value;
    }
  }
};

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

export function closeRequestPerfMetric() {
  const store = asyncLocalStorage.getStore();
  if (!store) {
    // eslint-disable-next-line no-console
    console.log('Missing asyncLocalStorage context when trying to close the perf metric for the current request!');
    return;
  }

  if (!store.requestPerfMetric) {
    // eslint-disable-next-line no-console
    console.log('Missing perf metric for the current request in the asyncLocalStorage context when trying to close it!');
    return;
  }

  closePerfMetric(store.requestPerfMetric);
  setStoreValue('requestPerfMetric', undefined);
}

export function perfMetricMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!performanceMetricLoggingEnabled.get()) {
    return next();
  }

  const perfMetric = openPerfMetric({
    op_type: 'request',
    op_name: req.originalUrl,
    client_path: req.headers['request-origin-path'] as string,
    ip: getForwardedWhitelist().getClientIP(req),
    user_agent: req.headers["user-agent"]
  });

  res.on('finish', () => {
    closeRequestPerfMetric();
  });
  
  // This starts an async context for requests that pass through this middleware
  asyncLocalStorage.run<void, []>({ requestPerfMetric: perfMetric }, next);
}
