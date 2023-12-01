import { v4 } from 'uuid';
import { queuePerfMetric } from './analyticsWriter';

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
