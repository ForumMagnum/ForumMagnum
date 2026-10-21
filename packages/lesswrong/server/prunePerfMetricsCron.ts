import type { ForumTypeString } from "@/lib/instanceSettings";
import { pruneOldPerfMetrics } from "./analytics/serverAnalyticsWriter";
import { performanceMetricLoggingEnabled } from "../lib/instanceSettings";

export async function prunePerfMetrics(forumType: ForumTypeString) {
  if (performanceMetricLoggingEnabled.get(forumType)) {
    await pruneOldPerfMetrics();
  }
}
