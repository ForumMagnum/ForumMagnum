import { v4 } from 'uuid';
import { PerfMetric, queuePerfMetric } from './analyticsWriter';

type IncompletePerfMetricProps = Pick<PerfMetric, 'op_type' | 'op_name' | 'parent_trace_id' | 'variables'> & { context: ResolverContext };
type IncompletePerfMetric = Omit<PerfMetric, 'ended_at'>;

export function generateTraceId() {
  return v4();
}

export function openPerfMetric(props: IncompletePerfMetricProps): IncompletePerfMetric {
  const { context, ...rest } = props;
  return {
    ...rest,
    started_at: new Date(),
    trace_id: v4(),
    client_path: context.headers['request-origin-path']
  };
}

export function closePerfMetric(openPerfMetric: IncompletePerfMetric) {
  const perfMetric = {
    ...openPerfMetric,
    ended_at: new Date()
  };

  queuePerfMetric(perfMetric);
}
