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
}
