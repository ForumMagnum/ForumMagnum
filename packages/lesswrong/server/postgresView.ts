import { getSqlClientOrThrow } from "../lib/sql/sqlClient";
import { queryWithLock } from "./queryWithLock";
import type { CronJobSpec } from "./cronUtil";

type PostgresViewRefreshSpec = {
  interval: string,
  query: string,
}

class PostgresView {
  constructor(
    private name: string,
    private createViewQuery: string,
    private createIndexQueries: string[] = [],
    private refreshSpec?: PostgresViewRefreshSpec,
    private queryTimeout = 60,
  ) {}

  getName(): string {
    return this.name;
  }

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
    if (this.refreshSpec) {
      await queryWithLock(db, this.refreshSpec.query, this.queryTimeout);
    }
  }

  registerCronJob(addCronJob: (options: CronJobSpec) => void) {
    if (this.refreshSpec) {
      addCronJob({
        name: `refreshPostgresView-${this.name}`,
        interval: this.refreshSpec.interval,
        job: () => this.refresh(getSqlClientOrThrow()),
      });
    }
  }
}

const postgresViews: PostgresView[] = [];

export const createPostgresView = (
  name: string,
  createViewQuery: string,
  createIndexQueries: string[] = [],
  refreshSpec?: PostgresViewRefreshSpec,
) => {
  for (const view of postgresViews) {
    if (view.getCreateViewQuery() === createViewQuery) {
      return;
    }
  }
  const view = new PostgresView(
    name,
    createViewQuery,
    createIndexQueries,
    refreshSpec,
  );
  postgresViews.push(view);
}

export const ensurePostgresViewsExist = async (
  db = getSqlClientOrThrow(),
  /** Dependency injected to avoid cycle. Should always be passed in unless in testing. */
  addCronJob?: (options: CronJobSpec) => void,
) => {
  await Promise.all(postgresViews.map((view) => view.createView(db)));
  await Promise.all(postgresViews.map((view) => view.createIndexes(db)));
  if (addCronJob) {
    for (const view of postgresViews) {
      view.registerCronJob(addCronJob);
    }
  }
}

export const getPostgresViewByName = (name: string): PostgresView => {
  const view = postgresViews.find((view) => view.getName() === name);
  if (!view) {
    throw new Error(`Postgres view not found: ${name}`);
  }
  return view;
}
