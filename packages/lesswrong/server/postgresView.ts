import { getSqlClientOrThrow } from "../lib/sql/sqlClient";
import { queryWithLock } from "./queryWithLock";
import { addCronJob } from "./cronUtil";

class PostgresView {
  constructor(
    private createViewQuery: string,
    private createIndexQueries: string[] = [],
    private refreshQuery?: string,
    private queryTimeout = 60,
  ) {}

  getCreateViewQuery() {
    return this.createViewQuery;
  }

  async createView(db: SqlClient) {
    await queryWithLock(db, this.createViewQuery, this.queryTimeout);
  }

  async createIndexes(db: SqlClient) {
    await Promise.all(this.createIndexQueries.map((index) =>
      queryWithLock(db, index, this.queryTimeout),
    ));
  }

  async refresh(db: SqlClient) {
    if (this.refreshQuery) {
      await queryWithLock(db, this.refreshQuery, this.queryTimeout);
    }
  }
}

const postgresViews: PostgresView[] = [];

export const createPostgresView = (
  createViewQuery: string,
  createIndexQueries: string[] = [],
  refreshQuery?: string,
) => {
  for (const view of postgresViews) {
    if (view.getCreateViewQuery() === createViewQuery) {
      return;
    }
  }
  const view = new PostgresView(
    createViewQuery,
    createIndexQueries,
    refreshQuery,
  );
  postgresViews.push(view);
}

export const ensurePostgresViewsExist = async (db = getSqlClientOrThrow()) => {
  await Promise.all(postgresViews.map((view) => view.createView(db)));
  await Promise.all(postgresViews.map((view) => view.createIndexes(db)));
}

addCronJob({
  name: "refreshPostgresViews",
  interval: "every 1 hour",
  job: async () => {
    // Run these in series as they're potentially expensive
    for (const view of postgresViews) {
      await view.refresh(getSqlClientOrThrow());
    }
  },
});
