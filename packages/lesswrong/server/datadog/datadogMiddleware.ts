import { getDatadogUser } from '../../lib/collections/users/helpers'
import type { Request } from 'express';
import tracer from './tracer'

export const getIpFromRequest = (req: Request): string => {
  let ipOrIpArray = req.headers['x-forwarded-for'] || req.headers["x-real-ip"] || req.connection.remoteAddress || "unknown";
  let ip = typeof ipOrIpArray === "object" ? ipOrIpArray[0] : ipOrIpArray as string;
  if (ip.indexOf(",") >= 0) {
    ip = ip.split(",")[0];
  }
  return ip;
}

/**
 * - Attach user info and IP address to the root span
 * - Allow the headers required for Real User Monitoring
 */
export const datadogMiddleware = (req: AnyBecauseTodo, res: AnyBecauseTodo, next: AnyBecauseTodo) => {
  const span = tracer.scope().active()
  if (span !== null) {
    // @ts-ignore - there is currently no public API for getting the root span, this is the accepted way (see https://github.com/DataDog/dd-trace-js/issues/725#issuecomment-805277510)
    const rootSpan = span.context()._trace.started[0]
    if (rootSpan) {
      const user = req.user
      if (user) {
        rootSpan.setTag('usr', getDatadogUser(user))
      }
  
      const ip = getIpFromRequest(req)
  
      // Set the IP address as a tag on the root span
      rootSpan.setTag('client.ip', ip)
    }
  }

  res.setHeader( 'Access-Control-Allow-Headers', 'x-datadog-trace-id, x-datadog-parent-id, x-datadog-origin, x-datadog-sampling-priority, traceparent' );
  next();
}
