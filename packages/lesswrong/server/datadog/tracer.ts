// eslint-disable-next-line no-restricted-imports
import tracer from "dd-trace";
// eslint-disable-next-line no-restricted-imports
import { StatsD } from "hot-shots";
import { datadogMiddleware } from "./datadogMiddleware";

tracer.init({
  hostname: process.env.IS_DOCKER ? "172.17.0.1" : undefined,
  sampleRate: 1,
  // TODO: Enabling log injection would let us associate logs with traces, but this requires setting up a json
  // logger rather than using console.log
  // logInjection: true
});
tracer.use('express', {
  service: 'forummagnum'
})

export const dogstatsd = new StatsD({
  host: process.env.IS_DOCKER ? "172.17.0.1" : undefined,
  prefix: 'forummagnum.'
});

datadogMiddleware(tracer);
export default tracer;
