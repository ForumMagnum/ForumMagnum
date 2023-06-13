import { captureEvent } from "../lib/analyticsEvents";

const receiveAnalytics = (type: string, event: Record<string, any>) => {
  // See https://docs.type3.audio/#analytics-events for documentation
  const qualifiedType = `type3.${type}`;
  captureEvent(qualifiedType, event);
}

(window as any).t3aAnalytics = receiveAnalytics;
