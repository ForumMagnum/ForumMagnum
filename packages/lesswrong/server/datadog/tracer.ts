import tracer from "dd-trace";
tracer.init({
  hostname: process.env.IS_DOCKER ? "172.17.0.1" : undefined,
  // TODO: Enabling log injection would let us associate logs with traces, but this requires setting up a json
  // logger rather than using console.log
  // logInjection: true
}); // initialized in a different file to avoid hoisting.
tracer.use('express', {
  service: 'eaforum'
})
export default tracer;
