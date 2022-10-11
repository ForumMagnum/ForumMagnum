import tracer from "dd-trace";
tracer.init({
  hostname: process.env.IS_DOCKER ? "172.17.0.1" : undefined,
  // logInjection: true
}); // initialized in a different file to avoid hoisting.
tracer.use('express', {
  service: 'eaforum'
})
export default tracer;
