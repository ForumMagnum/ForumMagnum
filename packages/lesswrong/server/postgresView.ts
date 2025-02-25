import { getSqlClientOrThrow } from "./sql/sqlClient";
import { queryWithLock } from "./queryWithLock";
import { addCronJob, CronJobSpec } from "./cron/cronUtil";

type PostgresViewRefreshSpec = {
  interval: string,
  query: string,
}

export class PostgresView {
  private cronJob: CronJobSpec|null = null;

  constructor(
    private name: string,
    private createViewQuery: string,
    private createIndexQueries: string[] = [],
    private refreshSpec?: PostgresViewRefreshSpec,
    private dependencies?: SchemaDependency[],
    private queryTimeout = 60,
  ) {
    if (this.refreshSpec) {
      this.cronJob = addCronJob({
        name: `refreshPostgresView-${this.name}`,
        interval: this.refreshSpec.interval,
        job: () => this.refresh(getSqlClientOrThrow()),
      });
    }
  }

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

  getCronJob() {
    return this.cronJob;
  }
}

const postgresViews: PostgresView[] = [];

export const createPostgresView = (
  name: string,
  createViewQuery: string,
  createIndexQueries: string[] = [],
  refreshSpec?: PostgresViewRefreshSpec,
  dependencies?: SchemaDependency[],
): PostgresView => {
  const view = new PostgresView(
    name,
    createViewQuery,
    createIndexQueries,
    refreshSpec,
    dependencies,
  );
  postgresViews.push(view);
  return view;
}

export const getPostgresViewByName = (name: string): PostgresView => {
  const view = postgresViews.find((view) => view.getName() === name);
  if (!view) {
    throw new Error(`Postgres view not found: ${name}`);
  }
  return view;
}

export const getAllPostgresViews = (): PostgresView[] => postgresViews;

