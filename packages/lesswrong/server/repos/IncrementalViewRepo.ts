import chunk from "lodash/chunk";
import { randomId } from "@/lib/random";
import { getPgPromiseLib } from "@/server/sqlConnection";
import AbstractRepo from "./AbstractRepo";

export type IncrementalViewDataType<N extends CollectionNameString> = Omit<
  ObjectsByCollectionName[N],
  "_id" | "schemaVersion" | "createdAt" | "legacyData" | "windowStart" | "windowEnd"
> & {
  windowStart: string;
  windowEnd: string;
};

/**
 * `IncrementalViewRepo` is designed for collections that operate as materialized views,
 * with "Incremental View Maintenance" (e.g. for cases where REFRESH MATERIALIZED VIEW is too slow).
 *
 * This is currently (2024-01-16) fairly tailored to to the case of daily post analytics, but it could be
 * extended to work for other (non-daily, non-analytics) purposes. See packages/lesswrong/server/analytics/analyticsCron.ts
 * for an example of how this is used.
 */
export default abstract class IncrementalViewRepo<N extends CollectionNameString> extends AbstractRepo<N> {
  abstract calculateDataForDateRange({
    startDate,
    endDate,
  }: {
    startDate: Date;
    endDate: Date;
  }): Promise<IncrementalViewDataType<N>[]>;

  abstract deleteRange({ startDate, endDate }: { startDate: Date; endDate: Date }): Promise<void>;

  abstract upsertData({ data }: { data: IncrementalViewDataType<N>[] }): void;

  abstract getDateBounds(): Promise<{ earliestWindowStart: Date | null; latestWindowEnd: Date | null }>;

  /**
   * Inserts `data`, overwriting `valueColumns` on any rows that already exist with
   * the same `keyColumns`.
   */
  protected async upsertRows(
    data: IncrementalViewDataType<N>[],
    keyColumns: (keyof IncrementalViewDataType<N> & string)[],
    valueColumns: (keyof IncrementalViewDataType<N> & string)[],
  ) {
    const { helpers } = getPgPromiseLib();
    const columnSet = new helpers.ColumnSet(
      ["_id", "createdAt", "updatedAt", ...keyColumns, ...valueColumns],
      { table: this.getCollection().getTable().getName() },
    );
    const conflictTarget = new helpers.ColumnSet(keyColumns).names;
    const updates = columnSet.assignColumns({ from: "EXCLUDED", skip: ["_id", "createdAt", ...keyColumns] });

    const now = new Date();
    const rows = data.map((row) => ({ ...row, _id: randomId(), createdAt: now, updatedAt: now }));

    // Avoid doing too many at once, expect about 5000 total per day
    for (const rowsChunk of chunk(rows, 1000)) {
      // This SQL contains client-supplied values from analytics events, escaped by
      // `helpers.insert`. It can't go through `this.none`, which passes `[]` as the
      // args and so would make pg-promise treat any `$1` inside those values as a
      // placeholder.
      await this.getRawDb().none(
        `${helpers.insert(rowsChunk, columnSet)} ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updates}`,
      );
    }
  }
}
