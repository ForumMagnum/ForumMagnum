import tracer from "dd-trace";
tracer.init({
  // hostname: "172.17.0.1",
  // logInjection: true
}); // initialized in a different file to avoid hoisting.
tracer.use('express', {
  service: 'eaforum'
})
export default tracer;
