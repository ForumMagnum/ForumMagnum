import { DatabaseMetadata } from "@/server/collections/databaseMetadata/collection";
import { randomId } from "@/lib/random";
import AbstractRepo from "./AbstractRepo";

const LEASE_NAME = "aiDigestScheduledEmailsLease";
// Generation can take several minutes. Expiry recovers from killed cron workers;
// ownership is renewed before each reader and checked again before sending.
const LEASE_DURATION_MS = 30 * 60 * 1_000;

export default class AiDigestScheduleLeaseRepo extends AbstractRepo<"DatabaseMetadata"> {
  constructor() {
    super(DatabaseMetadata);
  }

  async tryAcquire(): Promise<string | null> {
    const token = randomId();
    const lease = await this.getRawDb().oneOrNone(`
      -- AiDigestScheduleLeaseRepo.tryAcquire
      INSERT INTO "DatabaseMetadata" ("_id", "name", "value", "createdAt")
      VALUES ($(token), $(name), jsonb_build_object(
        'token', $(token)::text,
        'expiresAt', NOW() + $(durationMs) * interval '1 millisecond'
      ), NOW())
      ON CONFLICT ("name") DO UPDATE SET "value" = EXCLUDED."value"
      WHERE ("DatabaseMetadata"."value"->>'expiresAt')::timestamptz <= NOW()
      RETURNING "_id"
    `, { token, name: LEASE_NAME, durationMs: LEASE_DURATION_MS });
    return lease ? token : null;
  }

  async renew(token: string): Promise<boolean> {
    const lease = await this.getRawDb().oneOrNone(`
      -- AiDigestScheduleLeaseRepo.renew
      UPDATE "DatabaseMetadata"
      SET "value" = jsonb_build_object(
        'token', $(token)::text,
        'expiresAt', NOW() + $(durationMs) * interval '1 millisecond'
      )
      WHERE "name" = $(name) AND "value"->>'token' = $(token)
        AND ("value"->>'expiresAt')::timestamptz > NOW()
      RETURNING "_id"
    `, { token, name: LEASE_NAME, durationMs: LEASE_DURATION_MS });
    return !!lease;
  }

  async release(token: string): Promise<void> {
    await this.getRawDb().none(`
      -- AiDigestScheduleLeaseRepo.release
      DELETE FROM "DatabaseMetadata"
      WHERE "name" = $(name) AND "value"->>'token' = $(token)
    `, { token, name: LEASE_NAME });
  }
}
