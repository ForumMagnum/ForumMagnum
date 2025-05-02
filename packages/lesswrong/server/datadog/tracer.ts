import tracer from "dd-trace";
import { StatsD } from "hot-shots";
import { isDatadogEnabled } from "../../lib/instanceSettings";

if (isDatadogEnabled) {
  tracer.init({
    hostname: process.env.IS_DOCKER ? "172.17.0.1" : undefined,
    sampleRate: 1,
    // TODO: Enabling log injection would let us associate logs with traces, but this requires setting up a json
    // logger rather than using console.log
    // logInjection: true
  });
  tracer.use('express', {
    service: 'forummagnum',
    blocklist: [
      // This stays open for a long time and skews the average request duration
      /notificationEvents/
    ]
  })
}

export const dogstatsd = isDatadogEnabled
  ? new StatsD({
      host: process.env.IS_DOCKER ? "172.17.0.1" : undefined,
      prefix: 'forummagnum.',
      sampleRate: 1
    })
  : null;

// eslint-disable-next-line no-barrel-files/no-barrel-files
export default tracer;
