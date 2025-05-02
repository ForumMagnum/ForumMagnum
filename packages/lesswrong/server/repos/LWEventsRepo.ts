import { LWEvents } from "@/server/collections/lwevents/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class LWEventsRepo extends AbstractRepo<"LWEvents"> {
  constructor() {
    super(LWEvents);
  }
}

recordPerfMetrics(LWEventsRepo);

export default LWEventsRepo;
