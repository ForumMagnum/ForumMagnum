import tracer from './tracer'

/**
 * - Attach user info to the root span
 * - Allow the headers required for Real User Monitoring
 */
export const datadogMiddleware = (req, res, next) => {
  const span = tracer.scope().active()
  if (span !== null) {
    // @ts-ignore - there is currently no public API for getting the root span, this is the accepted way (see https://github.com/DataDog/dd-trace-js/issues/725#issuecomment-805277510)
    const rootSpan = span.context()._trace.started[0]
    const user = req.user
    if (user) {
      rootSpan.setTag('usr', {id: user._id, name: user.slug, email: user.email})
    }
  }

  res.setHeader( 'Access-Control-Allow-Headers', 'x-datadog-trace-id, x-datadog-parent-id, x-datadog-origin, x-datadog-sampling-priority' );
  next();
}
