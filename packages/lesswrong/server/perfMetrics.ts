import { v4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

import { queuePerfMetric } from './analyticsWriter';
import type { Request, Response, NextFunction } from 'express';
import { performanceMetricLoggingEnabled } from '../lib/instanceSettings';
import { getForwardedWhitelist } from './forwarded_whitelist';

type IncompletePerfMetricProps = Pick<PerfMetric, 'op_type' | 'op_name' | 'parent_trace_id' | 'extra_data' | 'client_path' | 'gql_string' | 'sql_string' | 'ip' | 'user_agent' | 'user_id'>;

interface AsyncLocalStorageContext {
  resolverContext?: ResolverContext;
  requestPerfMetric?: IncompletePerfMetric;
  inDbRepoMethod?: boolean;
}

export const asyncLocalStorage = new AsyncLocalStorage<AsyncLocalStorageContext>();

export function setAsyncStoreValue<T extends keyof AsyncLocalStorageContext>(key: T, value: AsyncLocalStorageContext[T] | ((previousValue: AsyncLocalStorageContext[T]) => AsyncLocalStorageContext[T])) {
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

export function closePerfMetric(openPerfMetric: IncompletePerfMetric, endedAtOverride?: Date) {
  const perfMetric = {
    ...openPerfMetric,
    ended_at: endedAtOverride ?? new Date()
  };

  queuePerfMetric(perfMetric);
}

export function addStartRenderTimeToPerfMetric() {
  setAsyncStoreValue('requestPerfMetric', (incompletePerfMetric) => {
    if (!incompletePerfMetric) {
      // eslint-disable-next-line no-console
      console.log('Missing perf metric for the current request in the asyncLocalStorage context when trying to add start render time to it!');
      return;
    }
    
    return {
      ...incompletePerfMetric,
      render_started_at: new Date()
    };
  });
}

export function recordSqlQueryPerfMetric(sqlString: string, startTime: number, endTime: number) {
  const store = asyncLocalStorage.getStore();

  if (!store?.inDbRepoMethod) {
    const partialMetric = openPerfMetric({
      op_type: 'sql_query',
      op_name: 'compiled', // TODO: what do we even record here?
      parent_trace_id: store?.requestPerfMetric?.trace_id,
      // extra_data: filteredVariables,
      sql_string: sqlString
    }, new Date(startTime));
  
    closePerfMetric(partialMetric, new Date(endTime));
  }
}

/**
 * We have a dedicated function to send off the perf metric for the top-level request
 * This is because we track it in the async local storage context,
 * and we want to be careful not to send it multiple times, or leave it accessible after it's been sent off
 */
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
  setAsyncStoreValue('requestPerfMetric', undefined);
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
    user_agent: req.headers["user-agent"],
    user_id: req.user?._id,
  });

  res.on('finish', () => {
    closeRequestPerfMetric();
  });
  
  // This starts an async context for requests that pass through this middleware
  asyncLocalStorage.run<void, []>({ requestPerfMetric: perfMetric }, next);
}
