import { addCronJob } from "../cronUtil";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";

addCronJob({
  name: "updateUniquePostUpvoters",
  interval: "every 10 minutes",
  job: () => {
    const db = getSqlClientOrThrow();
    void db.none(`REFRESH MATERIALIZED VIEW "UniquePostUpvoters"`);
  },
});
