import HybridViewLogs from "../../lib/collections/hybridViewLogs/collection";
import { getSqlClient } from "../../lib/sql/sqlClient";
import crypto from "crypto";

export class HybridView {
  protected queryGenerator: (after: Date) => string;
  protected indexQueryGenerators: ((viewName: string) => string)[];
  protected versionHash: string;
  protected identifier: string;
  private db: RawSqlClient;
  private matViewName: string;

  constructor({
    queryGenerator,
    identifier,
    indexQueryGenerators,
    viewSqlClient,
  }: {
    queryGenerator: (after: Date) => string;
    identifier: string;
    /**
     * Array of functions that generate index queries, given the view name. You must provide at least one
     * UNIQUE index, without this it isn't possible to refresh the view without locking the table.
     */
    indexQueryGenerators: ((viewName: string) => string)[];
    viewSqlClient?: RawSqlClient;
  }) {
    const db = viewSqlClient ?? getSqlClient();
    if (!db) throw new Error("Unable to connect to analytics database - no database configured");

    this.queryGenerator = queryGenerator;
    const allTimeQuery = queryGenerator(new Date(0));
    const indexQuerySignatures = indexQueryGenerators.map((generator) => generator("view_name"));
    const versionSignature = `${allTimeQuery}::${indexQuerySignatures.join("::")}`;

    this.versionHash = crypto.createHash("sha256").update(versionSignature).digest("hex").slice(0, 16);
    this.identifier = identifier;
    // "hv" for "hybrid view"
    this.matViewName = `hv_${this.identifier}_${this.versionHash}`;
    this.indexQueryGenerators = indexQueryGenerators ?? [];
    this.db = db;
  }

  /**
   * For each unique identifier, set the latest to true for the most recent actionStartTime
   */
  async updateLatest() {
    // Note: this is a relatively slow way of doing this, but it will never be run in a performance critical context
    await this.db.none(`
      WITH latest_records AS (
          SELECT identifier, MAX("actionStartTime") as latestActionStartTime
          FROM "HybridViewLogs"
          GROUP BY identifier
      )
      UPDATE "HybridViewLogs" AS hv
      SET latest = CASE WHEN hv."actionStartTime" = latest_records.latestActionStartTime THEN true ELSE false END
      FROM latest_records
      WHERE hv.identifier = latest_records.identifier
  `);
  }

  async viewExistsStrict() {
    // Check if materialized view exists
    return this.db.oneOrNone(`
      SELECT
        1
      FROM
        pg_matviews
      WHERE
        matviewname = '${this.matViewName}'
    `);
  }

  async ensureView() {
    // Check if the materialized view exists according to hybridViewLogs (which will exist even if the view is in the
    // process of being created)
    const startTime = new Date();
    const mostRecentUpdate = await HybridViewLogs.find(
      { identifier: this.identifier, action: "CREATE_VIEW" },
      {
        sort: { actionStartTime: -1 },
        limit: 1,
      }
    ).fetch();

    if (
      mostRecentUpdate.length > 0 &&
      mostRecentUpdate[0].versionHash === this.versionHash &&
      mostRecentUpdate[0].status !== "FAILURE"
    ) {
      if (mostRecentUpdate[0].status === "IN_PROGRESS") {
        // eslint-disable-next-line no-console
        console.log(`Materialized view for ${this.identifier} is already in the process of being created`);
      } else {
        // eslint-disable-next-line no-console
        console.log(`Materialized view for ${this.identifier} has already been created`);
      }
      return;
    }

    const logEntryId = await HybridViewLogs.rawInsert({
      identifier: this.identifier,
      versionHash: this.versionHash,
      action: "CREATE_VIEW",
      actionStartTime: startTime,
      actionEndTime: null,
      status: "IN_PROGRESS",
    });

    try {
      // The materialized view should not exist according to hybridViewLogs, drop it just to make sure
      await this.db.none(`DROP MATERIALIZED VIEW IF EXISTS "${this.matViewName}"`);

      // Create the materialized view, filtering by a date in the distant past to include all rows.
      // Don't catch any error. If there is an error then we don't want to update the log table
      await this.db.none(`CREATE MATERIALIZED VIEW "${this.matViewName}" AS (${this.queryGenerator(new Date(0))})`);

      // Apply each index generator
      for (let i = 0; i < this.indexQueryGenerators.length; i++) {
        const indexQuery = this.indexQueryGenerators[i](this.matViewName);
        try {
          await this.db.none(indexQuery);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(`Failed to apply index generator ${i} for "${this.matViewName}"`, e);
        }
      }

      await HybridViewLogs.rawUpdateOne(logEntryId, { $set: { actionEndTime: new Date(), status: "SUCCESS" } });
    } catch (e) {
      await HybridViewLogs.rawUpdateOne(logEntryId, { $set: { actionEndTime: new Date(), status: "FAILURE" } });
      throw e;
    }

    // Drop older versions of this view, if this fails just continue
    try {
      const olderViews = await this.db.manyOrNone(
        `SELECT matviewname FROM pg_matviews WHERE matviewname LIKE 'hv_${this.identifier}_%' AND matviewname <> '${this.matViewName}'`
      );
      for (let view of olderViews) {
        await this.db.none(`DROP MATERIALIZED VIEW IF EXISTS "${view.matviewname}"`);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }

    await this.updateLatest();
  }

  async refreshMaterializedView() {
    const startTime = new Date();

    // Check if the materialized view is currently being refreshed
    const mostRecentUpdate = await HybridViewLogs.find(
      { identifier: this.identifier, action: "REFRESH_VIEW" },
      {
        sort: { actionStartTime: -1 },
        limit: 1,
      }
    ).fetch();

    // If a refresh action is already in progress or succeeded (and has the same versionHash), don't start another one
    if (
      mostRecentUpdate.length > 0 &&
      mostRecentUpdate[0].versionHash === this.versionHash &&
      mostRecentUpdate[0].status === "IN_PROGRESS"
    ) {
      // eslint-disable-next-line no-console
      console.log(`Materialized view for ${this.identifier} is already being refreshed`);
      return;
    }

    // Start log entry in 'IN_PROGRESS' status
    const logEntryId = await HybridViewLogs.rawInsert({
      identifier: this.identifier,
      versionHash: this.versionHash,
      action: "REFRESH_VIEW",
      actionStartTime: startTime,
      actionEndTime: null,
      status: "IN_PROGRESS",
    });

    try {
      // Try to refresh the materialized view
      await this.db.none(`REFRESH MATERIALIZED VIEW CONCURRENTLY "${this.matViewName}"`);

      // If refreshing the view was successful, update log entry to 'SUCCESS'
      await HybridViewLogs.rawUpdateOne(logEntryId, { $set: { actionEndTime: new Date(), status: "SUCCESS" } });
    } catch (e) {
      // If there was an error, update log entry to 'FAILURE'
      await HybridViewLogs.rawUpdateOne(logEntryId, { $set: { actionEndTime: new Date(), status: "FAILURE" } });
      throw e;
    }

    await this.updateLatest();
  }

  async hybridViewQuery() {
    // Check if materialized view exists
    const matViewExistsPromise = this.viewExistsStrict();

    const crossoverTimeRowPromise = this.db.oneOrNone(`
      SELECT
        date_trunc('day', "actionStartTime") AS "crossoverTime"
      FROM
        "HybridViewLogs"
      WHERE
        identifier = '${this.identifier}'
        AND action = 'REFRESH_VIEW'
        AND status = 'SUCCESS'
        AND latest = true
    `);

    if (!(await matViewExistsPromise)) {
      // Materialized view does not exist, so return only base view query. This might be slow, but it will only happen for a few minutes
      return `
        SELECT
            *,
            'live' AS source
        FROM
            (${this.queryGenerator(new Date(0))}) AS live_subquery
        `;
    }

    const crossoverTime = (await crossoverTimeRowPromise)?.crossoverTime ?? new Date(0);

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
