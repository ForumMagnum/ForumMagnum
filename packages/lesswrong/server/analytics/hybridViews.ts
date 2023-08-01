import { getSqlClient } from "../../lib/sql/sqlClient";
import crypto from "crypto";
import { getAnalyticsConnection } from "./postgresConnection";
import { addCronJob } from "../cronUtil";

export class HybridView {
  protected queryGenerator: (after: Date) => string;
  protected indexQueryGenerators: ((viewName: string) => string)[];
  protected versionHash: string;
  protected identifier: string;
  private viewSqlClient: RawSqlClient;
  private matViewName: string;

  constructor({
    identifier,
    queryGenerator,
    indexQueryGenerators,
    viewSqlClient,
  }: {
    identifier: string;
    queryGenerator: (after: Date) => string;
    /**
     * Array of functions that generate index queries, given the view name. You must provide at least one
     * UNIQUE index, without this it isn't possible to refresh the view without locking the table.
     */
    indexQueryGenerators: ((viewName: string) => string)[];
    viewSqlClient?: RawSqlClient;
  }) {
    const viewSqlClientToUse = viewSqlClient ?? getSqlClient();

    if (!viewSqlClientToUse) throw new Error("Unable to connect to database");
    this.viewSqlClient = viewSqlClientToUse;

    this.queryGenerator = queryGenerator;
    const allTimeQuery = queryGenerator(new Date(0));
    const indexQuerySignatures = indexQueryGenerators.map((generator) => generator("view_name"));
    const versionSignature = `${allTimeQuery}::${indexQuerySignatures.join("::")}`;

    this.versionHash = crypto.createHash("sha256").update(versionSignature).digest("hex").slice(0, 16);
    this.identifier = identifier;
    // "hv" for "hybrid view"
    this.matViewName = `hv_${this.identifier}_${this.versionHash}`;
    this.indexQueryGenerators = indexQueryGenerators ?? [];
  }

  async viewExists() {
    // Check if materialized view exists
    return this.viewSqlClient.oneOrNone(`
      SELECT
        1
      FROM
        pg_matviews
      WHERE
        matviewname = '${this.matViewName}'
    `);
  }

  async refreshInProgress() {
    // Check if materialized view refresh is in progress
    return this.viewSqlClient.oneOrNone<{duration: string}>(`
      SELECT
        now() - pg_stat_activity.query_start AS duration
      FROM pg_stat_activity
      WHERE
        state = 'active' AND
        query ~* '^REFRESH MATERIALIZED VIEW.*${this.matViewName}.*'
    `);
  }

  async createInProgress() {
    // Check if materialized view creation is in progress
    return this.viewSqlClient.oneOrNone<{duration: string}>(`
      SELECT
        pid,
        now() - pg_stat_activity.query_start AS duration,
        query
      FROM pg_stat_activity
      WHERE
        state = 'active' AND
        query ~* '^CREATE MATERIALIZED VIEW.*${this.matViewName}.*'
    `);
  }

  async ensureView() {
    if (await this.viewExists()) {
      // eslint-disable-next-line no-console
      console.log(`Materialized view for ${this.identifier} already exists`);
      return;
    }

    const createInProgress = await this.createInProgress();
    if (createInProgress) {
      const duration = createInProgress.duration;
      // eslint-disable-next-line no-console
      console.log(`Materialized view for ${this.identifier} is already in the process of being created. Query has been running for: ${duration}`);
      return;
    }

    // Create the materialized view, filtering by a date in the distant past to include all rows
    await this.viewSqlClient.none(
      `CREATE MATERIALIZED VIEW "${this.matViewName}" AS (${this.queryGenerator(new Date(0))})`
    );

    // Drop older versions of this view, if this fails just continue
    try {
      const olderViews = await this.viewSqlClient.manyOrNone<{matviewname: string}>(
        `SELECT matviewname FROM pg_matviews WHERE matviewname LIKE 'hv_${this.identifier}_%' AND matviewname <> '${this.matViewName}'`
      );
      for (let view of olderViews) {
        await this.viewSqlClient.none(`DROP MATERIALIZED VIEW IF EXISTS "${view.matviewname}"`);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }

  async ensureIndexes() {
    // Apply each index generator
    for (let i = 0; i < this.indexQueryGenerators.length; i++) {
      const indexQuery = this.indexQueryGenerators[i](this.matViewName);
      try {
        await this.viewSqlClient.none(indexQuery);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Failed to apply index generator ${i} for "${this.matViewName}"`, e);
      }
    }
  }

  async refreshMaterializedView() {
    if (!this.viewExists()) {
      await this.ensureView();
    } else {
      await this.ensureIndexes();
      
      await this.viewSqlClient.none(`REFRESH MATERIALIZED VIEW CONCURRENTLY "${this.matViewName}"`);
    }
  }

  async virtualTable() {
    /**
     * Use the penultimate window_end as the crossover time, as the last window_end may contain incomplete data.
     * This will return undefined if the view doesn't exist, or there is some other error (such as there being only one window_end)
     */
    const getCrossoverTime = async () => {
      try {
        const res = await this.viewSqlClient.oneOrNone<{window_end: Date}>(`
          SELECT window_end
          FROM (
            SELECT window_end
            FROM ${this.matViewName}
            ORDER BY window_end DESC
            LIMIT 2
          ) AS subquery
          ORDER BY window_end ASC
          LIMIT 1
        `);
        return res?.window_end;
      } catch (error) {
        // This can throw an error if the view doesn't exist yet
        return undefined;
      }
    };

    const crossoverTime = await getCrossoverTime();

    if (!crossoverTime) {
      if (!(await this.viewExists())) {
        // eslint-disable-next-line no-console
        console.log(`Falling back to live view: materialized view for ${this.identifier} doesn't exist yet`);
      } else {
        // eslint-disable-next-line no-console
        console.error(`Falling back to live view: unexpected error getting crossover time for ${this.identifier}`);
      }

      return `
        SELECT
            *,
            'live' AS source
        FROM
            (${this.queryGenerator(new Date(0))}) AS live_subquery
        `;
    }

    return `
        (
            SELECT
                *,
                'materialized' AS source
            FROM
                "${this.matViewName}"
            WHERE
                window_end <= '${crossoverTime.toISOString()}'
        )
        UNION ALL
        (
            SELECT
                *,
                'live' AS source
            FROM
                (${this.queryGenerator(crossoverTime)}) AS live_subquery
        )
    `;
  }
}

let hybridViews: Record<string, HybridView> = {};

export function registerHybridAnalyticsView({
  identifier,
  queryGenerator,
  indexQueryGenerators,
}: {
  identifier: string;
  queryGenerator: (after: Date) => string;
  /**
   * Array of functions that generate index queries, given the view name. You must provide at least one
   * UNIQUE index, without this it isn't possible to refresh the view without locking the table.
   */
  indexQueryGenerators: ((viewName: string) => string)[];
}) {
  const analyticsDb = getAnalyticsConnection();

  if (!analyticsDb) {
    throw new Error("No analytics DB configured");
  }

  const hybridView = new HybridView({
    identifier,
    queryGenerator,
    indexQueryGenerators,
    viewSqlClient: analyticsDb,
  });

  const ensureViewAndIndexes = async () => {
    await hybridView.ensureView();
    await hybridView.ensureIndexes();
  };
  void ensureViewAndIndexes();

  hybridViews[identifier] = hybridView;
}

export function getHybridView(identifier: string): HybridView | undefined {
  return hybridViews[identifier];
}

export async function refreshHybridViews() {
  await Promise.all(Object.values(hybridViews).map((hybridView) => void hybridView.refreshMaterializedView()));
}

addCronJob({
  name: "refreshHybridViews",
  interval: `every 1 day`,
  job: refreshHybridViews,
});

