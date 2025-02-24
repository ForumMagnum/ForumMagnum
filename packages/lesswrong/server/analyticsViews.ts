import { forumSelect } from "../lib/forumTypeUtils";
import { getAnalyticsConnection } from "./analytics/postgresConnection";
import { addCronJob } from "./cron/cronUtil";

const maintenanceQueries = forumSelect({
  EAForum: [
    "REFRESH MATERIALIZED VIEW CONCURRENTLY view_and_hours_logged_in_by_day",
    "REFRESH MATERIALIZED VIEW CONCURRENTLY views_and_hours_by_post_by_day",
  ],
  default: [],
});

export const cronMaintainAnalyticsViews = addCronJob({
  name: "maintainAnalyticsViews",
  interval: "every 24 hours",
  job: async () => {
    if (!maintenanceQueries.length) return;

    const db = getAnalyticsConnection()

    if (!db) return;

    for (const query of maintenanceQueries) {
      // Run these concurrently and don't wait, as they can take ~hours
      void db.none(query)
    }
  },
});
