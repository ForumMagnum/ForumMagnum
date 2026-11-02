import Pingbacks from "../collections/pingbacks/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import InsertQuery from "../sql/InsertQuery";

class PingbacksRepo extends AbstractRepo<"Pingbacks"> {
  constructor() {
    super(Pingbacks);
  }

  /**
   * Inserts the given pingbacks, skipping any whose source and target posts
   * already have a pingback (eg, from a concurrent save of the same post).
   * Returns the pingbacks that were inserted.
   */
  async insertNewPingbacks(pingbacks: InsertionRecord<DbPingback>[]): Promise<DbPingback[]> {
    if (!pingbacks.length) return [];
    const { sql, args } = new InsertQuery(this.collection.getTable(), pingbacks).compile();
    return this.any(`
      -- PingbacksRepo.insertNewPingbacks
      ${sql}
      ON CONFLICT ("sourcePostId", "targetPostId") DO NOTHING
      RETURNING *
    `, args);
  }
}

recordPerfMetrics(PingbacksRepo);

export default PingbacksRepo;
