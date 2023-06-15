import { captureEvent } from "../lib/analyticsEvents";

const receiveAnalytics = (type: string, event: Record<string, AnyBecauseIsInput>) => {
  // See https://docs.type3.audio/#analytics-events for documentation
  const qualifiedType = `type3.${type}`;
  captureEvent(qualifiedType, event);
}

declare global {
  interface Window {
    t3aAnalytics: typeof receiveAnalytics,
  }
}

window.t3aAnalytics = receiveAnalytics;
