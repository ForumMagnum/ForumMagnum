import { v4 } from 'uuid';
import { queuePerfMetric } from './analyticsWriter';
import type { Request, Response, NextFunction } from 'express';

type IncompletePerfMetricProps = Pick<PerfMetric, 'op_type' | 'op_name' | 'parent_trace_id' | 'extra_data' | 'client_path'>;

export function generateTraceId() {
  return v4();
}

export function openPerfMetric(props: IncompletePerfMetricProps): IncompletePerfMetric {
  return {
    ...props,
    started_at: new Date(),
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
  const perfMetric = openPerfMetric({
    op_type: 'request',
    op_name: req.originalUrl,
    client_path: req.headers['request-origin-path'] as string
  });

  Object.assign(req, { perfMetric });
  res.on('finish', () => {
    closePerfMetric(perfMetric);
  });
  next();
}
