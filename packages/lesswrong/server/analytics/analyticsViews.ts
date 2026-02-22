import { getAnalyticsConnection } from "./postgresConnection";

const getMaintenanceQueries = () => [];

export const maintainAnalyticsViews = () => {
  if (!getMaintenanceQueries().length) return;

  const db = getAnalyticsConnection()

  if (!db) return;

  for (const query of getMaintenanceQueries()) {
    // Run these concurrently and don't wait, as they can take ~hours
    // Explicit not running them in a background task given their runtime
    // would be longer than a function lifetime and there's no reason to pay that cost.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    void db.none(query)
  }
};
