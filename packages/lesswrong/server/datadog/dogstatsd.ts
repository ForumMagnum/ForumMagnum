import { isDatadogEnabledOnSite } from "../../lib/instanceSettings";
// eslint-disable-next-line no-restricted-imports
import type { StatsD } from "hot-shots";

let stats: StatsD|null = null;
function getDatadogStatsD(): StatsD {
  if (!stats) {
    const { dogstatsd } = require('./tracer');
    stats = dogstatsd;
  }
  return stats!;
}

export function incrementDogStats(eventName: string, options: any) {
  if (isDatadogEnabledOnSite()) {
    getDatadogStatsD().increment(eventName, options);
  }
}

