import { captureEvent } from "../lib/analyticsEvents";

const receiveAnalytics = (type: string, event: Record<string, any>) => {
  const qualifiedType = `type3.${type}`;
  // TODO
  console.log("received type 3 analytics", qualifiedType, event);
  captureEvent(qualifiedType, event);
}

(window as any).t3aAnalytics = receiveAnalytics;
