import { forumSelect } from "@/lib/forumTypeUtils";
import { getAnalyticsConnection } from "./postgresConnection";

const getMaintenanceQueries = () => forumSelect({
  EAForum: [
    "REFRESH MATERIALIZED VIEW CONCURRENTLY view_and_hours_logged_in_by_day",
    "REFRESH MATERIALIZED VIEW CONCURRENTLY views_and_hours_by_post_by_day",
  ],
  default: [],
});

export const maintainAnalyticsViews = async () => {
  if (!getMaintenanceQueries().length) return;

  const db = getAnalyticsConnection()

  if (!db) return;

  for (const query of getMaintenanceQueries()) {
    // Run these concurrently and don't wait, as they can take ~hours
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    void db.none(query)
  }
};
