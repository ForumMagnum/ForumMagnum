import { addCronJob } from "../cronUtil";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { refreshUniquePostUpvotersQuery } from "./UniquePostUpvoters";

addCronJob({
  name: "updateUniquePostUpvoters",
  interval: "every 10 minutes",
  job: () => {
    const db = getSqlClientOrThrow();
    void db.none(refreshUniquePostUpvotersQuery);
  },
});
