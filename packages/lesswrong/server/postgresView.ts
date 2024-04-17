import { getSqlClientOrThrow } from "../lib/sql/sqlClient";
import { queryWithLock } from "./queryWithLock";
import type { CronJobSpec } from "./cronUtil";

class PostgresView {
  constructor(
    private name: string,
    private refreshInterval: string,
    private createViewQuery: string,
    private createIndexQueries: string[] = [],
    private refreshQuery?: string,
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
    if (this.refreshQuery) {
      await queryWithLock(db, this.refreshQuery, this.queryTimeout);
    }
  }

  registerCronJob(addCronJob: (options: CronJobSpec) => void) {
    addCronJob({
      name: `refreshPostgresView-${this.name}`,
      interval: this.refreshInterval,
      job: () => this.refresh(getSqlClientOrThrow()),
    });
  }
}

const postgresViews: PostgresView[] = [];

export const createPostgresView = (
  name: string,
  refreshInterval: string,
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
    name,
    refreshInterval,
    createViewQuery,
    createIndexQueries,
    refreshQuery,
  );
  postgresViews.push(view);
}

export const ensurePostgresViewsExist = async (
  db = getSqlClientOrThrow(),
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
