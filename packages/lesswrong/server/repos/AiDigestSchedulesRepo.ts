import AiDigestSchedules from "@/server/collections/aiDigestSchedules/collection";
import { randomId } from "@/lib/random";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

/** Readers the scheduled digest goes to: subscribed admins who can receive email. */
// TODO: the beta is admin-only; widening it should come with the other production changes.
const aiDigestRecipientConditions = (userAlias: string) => `
  ${userAlias}."emailSubscribedToAiDigest" IS TRUE
  AND ${userAlias}."isAdmin" IS TRUE
  AND ${userAlias}.deleted IS NOT TRUE
  AND ${userAlias}.email IS NOT NULL
  AND ${userAlias}."unsubscribeFromAll" IS NOT TRUE
  AND fm_has_verified_email(${userAlias}.emails)
`;

class AiDigestSchedulesRepo extends AbstractRepo<"AiDigestSchedules"> {
  constructor() {
    super(AiDigestSchedules);
  }

  /** Gives every recipient without a schedule one that is due now. */
  async addMissingSchedules(): Promise<void> {
    const userIds = await this.getRawDb().manyOrNone<{ _id: string }>(`
      -- AiDigestSchedulesRepo.addMissingSchedules
      SELECT u."_id"
      FROM "Users" u
      WHERE ${aiDigestRecipientConditions("u")}
        AND NOT EXISTS (SELECT 1 FROM "AiDigestSchedules" s WHERE s."userId" = u."_id")
    `);
    for (const { _id: userId } of userIds) {
      await this.getRawDb().none(`
        -- AiDigestSchedulesRepo.addMissingSchedules
        INSERT INTO "AiDigestSchedules" ("_id", "userId", "nextDueAt")
        VALUES ($(scheduleId), $(userId), NOW())
        ON CONFLICT ("userId") DO NOTHING
      `, { scheduleId: randomId(), userId });
    }
  }

  /**
   * Claims up to `limit` due recipients until `claimDurationMs` from now. A row
   * claimed by one run can't be claimed by another until the claim is released
   * or lapses, so concurrent runs never generate or send for the same reader.
   */
  claimDueSchedules({ limit, claimDurationMs }: {
    limit: number;
    claimDurationMs: number;
  }): Promise<DbAiDigestSchedule[]> {
    return this.getRawDb().manyOrNone<DbAiDigestSchedule>(`
      -- AiDigestSchedulesRepo.claimDueSchedules
      UPDATE "AiDigestSchedules" s
      SET "claimedUntil" = NOW() + $(claimDurationMs) * INTERVAL '1 millisecond'
      WHERE s."_id" IN (
        SELECT due."_id"
        FROM "AiDigestSchedules" due
        INNER JOIN "Users" u ON u."_id" = due."userId"
        WHERE due."nextDueAt" <= NOW()
          AND (due."claimedUntil" IS NULL OR due."claimedUntil" < NOW())
          AND ${aiDigestRecipientConditions("u")}
        ORDER BY due."nextDueAt"
        LIMIT $(limit)
        FOR UPDATE OF due SKIP LOCKED
      )
      RETURNING s.*
    `, { limit, claimDurationMs });
  }
}

recordPerfMetrics(AiDigestSchedulesRepo);

export default AiDigestSchedulesRepo;
