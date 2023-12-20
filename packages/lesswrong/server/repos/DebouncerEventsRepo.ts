import AbstractRepo from "./AbstractRepo";
import DebouncerEvents from "../../lib/collections/debouncerEvents/collection";
import { randomId } from "../../lib/random";
import { recordPerfMetrics } from "./perfMetricWrapper";

class DebouncerEventsRepo extends AbstractRepo<"DebouncerEvents"> {
  constructor() {
    super(DebouncerEvents);
  }

  recordEvent(
    name: string,
    af: boolean,
    delayTime: Date,
    upperBoundTime: Date,
    key: string,
    data?: string,
  ): Promise<null> {
    return this.none(`
      -- DebouncerEventsRepo.recordEvent
      INSERT INTO "DebouncerEvents" (
        "_id",
        "name",
        "af",
        "delayTime",
        "upperBoundTime",
        "key",
        "pendingEvents",
        "dispatched"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, FALSE
      ) ON CONFLICT (
        "dispatched",
        "af",
        "key",
        "name"
      ) WHERE "dispatched" IS FALSE
      DO UPDATE SET
        "delayTime" = GREATEST("DebouncerEvents"."delayTime", $4),
        "upperBoundTime" = LEAST("DebouncerEvents"."upperBoundTime", $5),
        "pendingEvents" = ARRAY_APPEND("DebouncerEvents"."pendingEvents", $8)
    `, [
      randomId(),
      name,
      af,
      delayTime,
      upperBoundTime,
      key,
      data === undefined ? null : [data],
      data,
    ]);
  }
}

recordPerfMetrics(DebouncerEventsRepo);

export default DebouncerEventsRepo;
