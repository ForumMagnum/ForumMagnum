import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { loggerConstructor } from "@/lib/utils/logging";
import { randomId } from "@/lib/random";

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

function parseMailgunResponse(json: unknown): MailgunValidationResult["parsed"] {
  if (!json || typeof json !== "object") return {};
  const obj = json as Record<string, unknown>;

  const isValid = typeof obj.is_valid === "boolean" ? obj.is_valid : undefined;
  const risk = typeof obj.risk === "string" ? obj.risk : undefined;
  const reason = typeof obj.reason === "string" ? obj.reason : undefined;
  const didYouMean = typeof obj.did_you_mean === "string" ? obj.did_you_mean : undefined;
  const isDisposableAddress =
    typeof obj.is_disposable_address === "boolean" ? obj.is_disposable_address : undefined;
  const isRoleAddress = typeof obj.is_role_address === "boolean" ? obj.is_role_address : undefined;

  return { isValid, risk, reason, didYouMean, isDisposableAddress, isRoleAddress };
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

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let idx = 0;
  async function runOne(): Promise<void> {
    while (true) {
      const myIdx = idx;
      idx += 1;
      if (myIdx >= items.length) return;
      await worker(items[myIdx]);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => runOne()));
}

/**
 * Validate and store a single email (used on new user creation).
 * No-ops if `MAILGUN_VALIDATION_API_KEY` is not set.
 */
export async function validateAndStoreMailgunValidation(args: {
  email: string;
  sourceUserId?: string | null;
}): Promise<void> {
  const normalizedEmail = args.email.trim().toLowerCase();
  if (!normalizedEmail) return;

  const res = await validateEmailWithMailgun({
    email: normalizedEmail,
    mailboxVerification: MAILBOX_VERIFICATION,
  });

  if (res.status === "error" && res.error === `${MAILGUN_API_KEY_ENV_VAR} is not set`) {
    return;
  }
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

  await runWithConcurrency(rows, concurrency, async ({ email, sourceUserId }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const res = await validateEmailWithMailgun({
      email: normalizedEmail,
      mailboxVerification: MAILBOX_VERIFICATION,
    });

    if (res.status === "error" && res.error === `${MAILGUN_API_KEY_ENV_VAR} is not set`) {
      return;
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
      sourceUserId,
    });

    if (res.status === "success") succeeded += 1;
    else failed += 1;
  });

  logger(`Done. processed=${rows.length} succeeded=${succeeded} failed=${failed}`);
  return { processed: rows.length, succeeded, failed };
}


