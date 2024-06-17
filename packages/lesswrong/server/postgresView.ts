import { getSqlClientOrThrow } from "./sql/sqlClient";
import { queryWithLock } from "./queryWithLock";
import { addCronJob, CronJobSpec } from "./cronUtil";

type PostgresViewRefreshSpec = {
  interval: string,
  query: string,
}

export class PostgresView {
  constructor(
    private name: string,
    private createViewQuery: string,
    private createIndexQueries: string[] = [],
    private refreshSpec?: PostgresViewRefreshSpec,
    private dependencies?: SchemaDependency[],
    private queryTimeout = 60,
  ) {}

  getName(): string {
    return this.name;
  }

  getCreateViewQuery() {
    return this.createViewQuery;
  }

  getCreateIndexQueries() {
    return this.createIndexQueries;
  }

  getDependencies() {
    return this.dependencies;
  }

  async refresh(db: SqlClient) {
    if (this.refreshSpec) {
      await queryWithLock(db, this.refreshSpec.query, this.queryTimeout);
    }
  }

  registerCronJob() {
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
  dependencies?: SchemaDependency[],
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
    dependencies,
  );
  postgresViews.push(view);
}

export const getPostgresViewByName = (name: string): PostgresView => {
  const view = postgresViews.find((view) => view.getName() === name);
  if (!view) {
    throw new Error(`Postgres view not found: ${name}`);
  }
  return view;
}

export const getAllPostgresViews = (): PostgresView[] => postgresViews;


export function registerViewCronJobs() {
  try {
    for (const view of getAllPostgresViews()) {
      view.registerCronJob();
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to ensure Postgres views exist:", e);
  }
}
