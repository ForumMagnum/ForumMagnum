import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { loggerConstructor } from "@/lib/utils/logging";
import { randomId } from "@/lib/random";
import { executePromiseQueue } from "@/lib/utils/asyncUtils";
import { z } from "zod";

const logger = loggerConstructor("mailgunValidations");

const MAILGUN_API_KEY_ENV_VAR = "MAILGUN_VALIDATION_API_KEY";
const MAILGUN_VALIDATE_URL = "https://api.mailgun.net/v4/address/validate";

const MAILBOX_VERIFICATION = false;
const BATCH_SIZE = 250;
const CONCURRENCY = 8;
const REQUEST_TIMEOUT_MS = 15_000;

interface MailgunValidationResult {
  status: "success" | "error";
  validatedAt: Date;
  httpStatus?: number;
  error?: string;
  result?: unknown;
  parsed?: {
    isValid?: boolean;
    risk?: string;
    reason?: string;
    didYouMean?: string;
    isDisposableAddress?: boolean;
    isRoleAddress?: boolean;
  };
}

type NextEmailRow = {
  email: string;
  sourceUserId: string | null;
};

function getMailgunApiKey(): string | null {
  return process.env[MAILGUN_API_KEY_ENV_VAR] ?? null;
}

function buildMailgunAuthHeader(apiKey: string): string {
  const token = Buffer.from(`api:${apiKey}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

async function fetchJsonWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const status = res.status;
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { rawText: text };
    }
    return { ok: res.ok, status, json };
  } finally {
    clearTimeout(timeout);
  }
}

// Mailgun v4 API response schema
// See: https://documentation.mailgun.com/docs/inboxready/mailgun-validate/single-validation-v4/
const mailgunResponseSchema = z.object({
  // "deliverable" | "undeliverable" | "risky" | "unknown" | "catch_all" | "do_not_send"
  result: z.string().optional(),
  risk: z.string().optional(),
  // reason is an array of strings in v4 API
  reason: z.array(z.string()).optional(),
  did_you_mean: z.string().nullable().optional(),
  is_disposable_address: z.boolean().optional(),
  is_role_address: z.boolean().optional(),
}).passthrough();

function parseMailgunResponse(json: unknown): MailgunValidationResult["parsed"] {
  const parsed = mailgunResponseSchema.safeParse(json);
  if (!parsed.success) return {};
  const data = parsed.data;

  // Convert "result" to boolean isValid
  // "deliverable" and "catch_all" are considered valid
  const isValid = data.result
    ? data.result === "deliverable" || data.result === "catch_all"
    : undefined;

  // Join reason array into a single string
  const reason = data.reason?.length ? data.reason.join("; ") : undefined;

  return {
    isValid,
    risk: data.risk,
    reason,
    didYouMean: data.did_you_mean ?? undefined,
    isDisposableAddress: data.is_disposable_address,
    isRoleAddress: data.is_role_address,
  };
}

async function validateEmailWithMailgun(args: {
  email: string;
  mailboxVerification: boolean;
}): Promise<MailgunValidationResult> {
  const { email, mailboxVerification } = args;

  const apiKey = getMailgunApiKey();
  if (!apiKey) {
    return {
      status: "error",
      validatedAt: new Date(),
      error: `${MAILGUN_API_KEY_ENV_VAR} is not set`,
    };
  }

  const url = new URL(MAILGUN_VALIDATE_URL);
  url.searchParams.set("address", email);
  url.searchParams.set("mailbox_verification", mailboxVerification ? "true" : "false");

  try {
    const { ok, status, json } = await fetchJsonWithTimeout(
      url.toString(),
      {
        method: "GET",
        headers: {
          Authorization: buildMailgunAuthHeader(apiKey),
        },
      },
      REQUEST_TIMEOUT_MS,
    );

    if (!ok) {
      // IMPORTANT:
      // - `loggerConstructor` is gated behind the `debuggers` setting.
      // - For errors we want always-visible output in dev, so also use console.error.
      // - Never log the API key.
      let responseSnippet = "(unstringifiable)";
      try {
        responseSnippet = JSON.stringify(json).slice(0, 2_000);
      } catch {}
      // eslint-disable-next-line no-console
      console.error(
        `[mailgunValidations] validate failed httpStatus=${status} email=${email} mailboxVerification=${mailboxVerification} response=${responseSnippet}`,
      );
      logger(
        `validate failed httpStatus=${status} email=${email} mailboxVerification=${mailboxVerification} response=${responseSnippet}`,
      );
      return {
        status: "error",
        validatedAt: new Date(),
        httpStatus: status,
        error: `Mailgun validation request failed (HTTP ${status})`,
        result: json,
      };
    }

    return {
      status: "success",
      validatedAt: new Date(),
      httpStatus: status,
      result: json,
      parsed: parseMailgunResponse(json),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // eslint-disable-next-line no-console
    console.error(
      `[mailgunValidations] validate request error email=${email} mailboxVerification=${mailboxVerification} err=${message}`,
    );
    logger(`validate request error email=${email} mailboxVerification=${mailboxVerification} err=${message}`);
    return {
      status: "error",
      validatedAt: new Date(),
      error: `Mailgun validation request error: ${message}`,
    };
  }
}

async function upsertMailgunValidation(args: {
  email: string;
  mailboxVerification: boolean;
  validatedAt: Date;
  status: "success" | "error";
  httpStatus?: number;
  error?: string;
  result?: unknown;
  parsed?: MailgunValidationResult["parsed"];
  sourceUserId: string | null;
}): Promise<void> {
  const db = getSqlClientOrThrow();
  const _id = randomId();

  const {
    email,
    mailboxVerification,
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
        "mailboxVerification",
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
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9::jsonb,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16
      )
      ON CONFLICT (email, "mailboxVerification")
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
    [
      _id,
      new Date(),
      email,
      mailboxVerification,
      validatedAt,
      httpStatus ?? null,
      status,
      error ?? null,
      result ? JSON.stringify(result) : null,
      parsed?.isValid ?? null,
      parsed?.risk ?? null,
      parsed?.reason ?? null,
      parsed?.didYouMean ?? null,
      parsed?.isDisposableAddress ?? null,
      parsed?.isRoleAddress ?? null,
      sourceUserId,
    ],
  );
}

async function getNextEmailsToValidate(args: {
  limit: number;
  mailboxVerification: boolean;
}): Promise<NextEmailRow[]> {
  const { limit, mailboxVerification } = args;
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
        AND mv."mailboxVerification" = $2
      WHERE mv._id IS NULL
      ORDER BY d.email
      LIMIT $1
    `,
    [limit, mailboxVerification],
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
  if (!getMailgunApiKey()) return;

  const normalizedEmail = args.email.trim().toLowerCase();
  if (!normalizedEmail) return;

  const res = await validateEmailWithMailgun({
    email: normalizedEmail,
    mailboxVerification: MAILBOX_VERIFICATION,
  });

  if (res.status === "error") {
    // eslint-disable-next-line no-console
    console.error(
      `[mailgunValidations] storing error result email=${normalizedEmail} httpStatus=${res.httpStatus ?? "n/a"} error=${res.error ?? "n/a"}`,
    );
  }

  await upsertMailgunValidation({
    email: normalizedEmail,
    mailboxVerification: MAILBOX_VERIFICATION,
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

  if (!getMailgunApiKey()) {
    logger(`${MAILGUN_API_KEY_ENV_VAR} is not set, skipping`);
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const limit = args?.limit ?? BATCH_SIZE;
  const concurrency = args?.concurrency ?? CONCURRENCY;

  const rows = await getNextEmailsToValidate({
    limit,
    mailboxVerification: MAILBOX_VERIFICATION,
  });

  if (rows.length === 0) {
    logger("No emails to validate");
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  logger(`Validating ${rows.length} emails`);

  let succeeded = 0;
  let failed = 0;

  const promiseGenerators = rows.map(({ email, sourceUserId }) => async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const res = await validateEmailWithMailgun({
      email: normalizedEmail,
      mailboxVerification: MAILBOX_VERIFICATION,
    });

    await upsertMailgunValidation({
      email: normalizedEmail,
      mailboxVerification: MAILBOX_VERIFICATION,
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


