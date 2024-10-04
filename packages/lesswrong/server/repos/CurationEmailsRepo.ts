import CurationEmails from "../../lib/collections/curationEmails/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class CurationEmailsRepo extends AbstractRepo<"CurationEmails"> {
  constructor() {
    super(CurationEmails);
  }

  removeFromQueue() {
    return this.oneOrNone(`
      DELETE
      FROM "CurationEmails"
      WHERE _id IN (
        SELECT _id
        FROM "CurationEmails"
        LIMIT 1
      )
      RETURNING *
    `);
  }
}

recordPerfMetrics(CurationEmailsRepo, { excludeMethods: ['removeFromQueue'] });

export default CurationEmailsRepo;
