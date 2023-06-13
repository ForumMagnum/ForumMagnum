import { captureEvent } from "../lib/analyticsEvents";

const receiveAnalytics = (type: string, event: Record<string, any>) => {
  const qualifiedType = `type3.${type}`;
  // TODO
  console.log("received type 3 analytics", qualifiedType, event);
  captureEvent(qualifiedType, event);
}

console.log("Setting up type3 analytics");
(window as any).t3aAnalytics = receiveAnalytics;
