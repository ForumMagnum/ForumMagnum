import { LWEvents } from "@/lib/collections/lwevents/collection.ts";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class LWEventsRepo extends AbstractRepo<"LWEvents"> {
  constructor() {
    super(LWEvents);
  }
}

recordPerfMetrics(LWEventsRepo);

export default LWEventsRepo;
