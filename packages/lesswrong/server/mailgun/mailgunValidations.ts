import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { loggerConstructor } from "@/lib/utils/logging";
import { randomId } from "@/lib/random";
import { executePromiseQueue } from "@/lib/utils/asyncUtils";
import type { ValidationResult } from "mailgun.js/definitions";
import { getMailgunClient } from "./mailgunClient";

const logger = loggerConstructor("mailgunValidations");

const BATCH_SIZE = 250;
const CONCURRENCY = 8;

interface ParsedValidationResult {
  isValid?: boolean;
  risk?: string;
  reason?: string;
  didYouMean?: string;
  isDisposableAddress?: boolean;
  isRoleAddress?: boolean;
}

interface MailgunValidationStorageResult {
  status: "success" | "error";
  validatedAt: Date;
  httpStatus?: number;
  error?: string;
  result?: unknown;
  parsed?: ParsedValidationResult;
}

type NextEmailRow = {
  email: string;
  sourceUserId: string | null;
};

function parseValidationResult(result: ValidationResult): ParsedValidationResult {
  // Convert "result" to boolean isValid
  // "deliverable" and "catch_all" are considered valid
  const isValid = result.result
    ? result.result === "deliverable" || result.result === "catch_all"
    : undefined;

  // Join reason array into a single string
  const reason = result.reason?.length ? result.reason.join("; ") : undefined;

  // The SDK types don't include did_you_mean but the API may return it
  const rawResult = result as ValidationResult & { did_you_mean?: string | null };

  return {
    isValid,
    risk: result.risk,
    reason,
    didYouMean: rawResult.did_you_mean ?? undefined,
    isDisposableAddress: result.is_disposable_address,
    isRoleAddress: result.is_role_address,
  };
}

async function validateEmailWithMailgun(email: string): Promise<MailgunValidationStorageResult> {
  const client = getMailgunClient();
  if (!client) {
    return {
      status: "error",
      validatedAt: new Date(),
      error: "MAILGUN_VALIDATION_API_KEY is not set",
    };
  }

  try {
    const result = await client.validate.get(email);

    return {
      status: "success",
      validatedAt: new Date(),
      httpStatus: 200,
      result,
      parsed: parseValidationResult(result),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // eslint-disable-next-line no-console
    console.error(`[mailgunValidations] validate request error email=${email} err=${message}`);
    logger(`validate request error email=${email} err=${message}`);

    // Try to extract HTTP status if available
    let httpStatus: number | undefined;
    if (e && typeof e === "object" && "status" in e && typeof e.status === "number") {
      httpStatus = e.status;
    }

    return {
      status: "error",
      validatedAt: new Date(),
      httpStatus,
      error: `Mailgun validation request error: ${message}`,
    };
  }
}

async function upsertMailgunValidation(args: {
  email: string;
  validatedAt: Date;
  status: "success" | "error";
  httpStatus?: number;
  error?: string;
  result?: unknown;
  parsed?: ParsedValidationResult;
  sourceUserId: string | null;
}): Promise<void> {
  const db = getSqlClientOrThrow();
  const _id = randomId();

  const {
    email,
    validatedAt,
    status,
    httpStatus,
    error,
    result,
    parsed,
    sourceUserId,
  } = args;

  await db.none(
    `
      -- mailgunValidations.upsertMailgunValidation
      INSERT INTO "MailgunValidations" (
        _id,
        "createdAt",
        email,
        "validatedAt",
        "httpStatus",
        status,
        error,
        result,
        "isValid",
        risk,
        reason,
        "didYouMean",
        "isDisposableAddress",
        "isRoleAddress",
        "sourceUserId"
      ) VALUES (
        $(id),
        $(createdAt),
        $(email),
        $(validatedAt),
        $(httpStatus),
        $(status),
        $(error),
        $(result)::jsonb,
        $(isValid),
        $(risk),
        $(reason),
        $(didYouMean),
        $(isDisposableAddress),
        $(isRoleAddress),
        $(sourceUserId)
      )
      ON CONFLICT (email)
      DO UPDATE SET
        "validatedAt" = EXCLUDED."validatedAt",
        "httpStatus" = EXCLUDED."httpStatus",
        status = EXCLUDED.status,
        error = EXCLUDED.error,
        result = EXCLUDED.result,
        "isValid" = EXCLUDED."isValid",
        risk = EXCLUDED.risk,
        reason = EXCLUDED.reason,
        "didYouMean" = EXCLUDED."didYouMean",
        "isDisposableAddress" = EXCLUDED."isDisposableAddress",
        "isRoleAddress" = EXCLUDED."isRoleAddress",
        "sourceUserId" = EXCLUDED."sourceUserId"
    `,
    {
      id: _id,
      createdAt: new Date(),
      email,
      validatedAt,
      httpStatus: httpStatus ?? null,
      status,
      error: error ?? null,
      result: result ? JSON.stringify(result) : null,
      isValid: parsed?.isValid ?? null,
      risk: parsed?.risk ?? null,
      reason: parsed?.reason ?? null,
      didYouMean: parsed?.didYouMean ?? null,
      isDisposableAddress: parsed?.isDisposableAddress ?? null,
      isRoleAddress: parsed?.isRoleAddress ?? null,
      sourceUserId,
    },
  );
}

async function getNextEmailsToValidate(limit: number): Promise<NextEmailRow[]> {
  const db = getSqlClientOrThrow();

  return db.any<NextEmailRow>(
    `
      -- mailgunValidations.getNextEmailsToValidate
      WITH eligible_users AS (
        SELECT u._id, u.email, u.emails
        FROM "Users" u
        WHERE u."deleted" IS NOT TRUE
          AND u."unsubscribeFromAll" IS NOT TRUE
          AND (
            (u."email" IS NOT NULL AND btrim(u."email") <> '')
            OR EXISTS (
              SELECT 1
              FROM unnest(coalesce(u."emails", array[]::jsonb[])) e
              WHERE coalesce((e->>'verified')::boolean, false) IS TRUE
            )
          )
      ),
      eligible_emails AS (
        SELECT btrim(u.email) AS email, u._id AS "sourceUserId"
        FROM eligible_users u
        WHERE u.email IS NOT NULL AND btrim(u.email) <> ''

        UNION ALL

        SELECT btrim(e->>'address') AS email, u._id AS "sourceUserId"
        FROM eligible_users u
        CROSS JOIN unnest(coalesce(u.emails, array[]::jsonb[])) e
        WHERE coalesce((e->>'verified')::boolean, false) IS TRUE
          AND (e ? 'address')
          AND btrim(e->>'address') <> ''
      ),
      dedup AS (
        SELECT
          lower(email) AS email_lc,
          MIN(email) AS email,
          MIN("sourceUserId") AS "sourceUserId"
        FROM eligible_emails
        GROUP BY lower(email)
      )
      SELECT d.email, d."sourceUserId"
      FROM dedup d
      LEFT JOIN "MailgunValidations" mv
        ON lower(mv.email) = d.email_lc
      WHERE mv._id IS NULL
      ORDER BY d.email
      LIMIT $(limit)
    `,
    { limit },
  );
}


/**
 * Validate and store a single email (used on new user creation).
 * No-ops if `MAILGUN_VALIDATION_API_KEY` is not set.
 */
export async function validateAndStoreMailgunValidation(args: {
  email: string;
  sourceUserId?: string | null;
}): Promise<void> {
  if (!getMailgunClient()) return;

  const normalizedEmail = args.email.trim().toLowerCase();
  if (!normalizedEmail) return;

  const res = await validateEmailWithMailgun(normalizedEmail);

  if (res.status === "error") {
    // eslint-disable-next-line no-console
    console.error(
      `[mailgunValidations] storing error result email=${normalizedEmail} httpStatus=${res.httpStatus ?? "n/a"} error=${res.error ?? "n/a"}`,
    );
  }

  await upsertMailgunValidation({
    email: normalizedEmail,
    validatedAt: res.validatedAt,
    status: res.status,
    httpStatus: res.httpStatus,
    error: res.error,
    result: res.result,
    parsed: res.parsed,
    sourceUserId: args.sourceUserId ?? null,
  });
}

/**
 * Backfill: validates up to N eligible emails that we haven't validated yet.
 * Intended to be called from a one-off script (e.g. via yarn repl).
 */
export async function runMailgunValidationsBatch(args?: {
  limit?: number;
  concurrency?: number;
}): Promise<{ processed: number; succeeded: number; failed: number }> {
  const logger = loggerConstructor("script-mailgunValidationsBatch");

  if (!getMailgunClient()) {
    logger("MAILGUN_VALIDATION_API_KEY is not set, skipping");
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const limit = args?.limit ?? BATCH_SIZE;
  const concurrency = args?.concurrency ?? CONCURRENCY;

  const rows = await getNextEmailsToValidate(limit);

  if (rows.length === 0) {
    logger("No emails to validate");
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  logger(`Validating ${rows.length} emails`);

  let succeeded = 0;
  let failed = 0;

  const promiseGenerators = rows.map(({ email, sourceUserId }) => async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const res = await validateEmailWithMailgun(normalizedEmail);

    await upsertMailgunValidation({
      email: normalizedEmail,
      validatedAt: res.validatedAt,
      status: res.status,
      httpStatus: res.httpStatus,
      error: res.error,
      result: res.result,
      parsed: res.parsed,
      sourceUserId,
    });

    if (res.status === "success") succeeded += 1;
    else failed += 1;
  });

  await executePromiseQueue(promiseGenerators, concurrency);

  logger(`Done. processed=${rows.length} succeeded=${succeeded} failed=${failed}`);
  return { processed: rows.length, succeeded, failed };
}
