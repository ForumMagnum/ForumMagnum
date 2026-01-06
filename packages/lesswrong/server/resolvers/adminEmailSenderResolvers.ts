import gql from "graphql-tag";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { EmailTokens } from "@/server/collections/emailTokens/collection";
import { LWEvents } from "@/server/collections/lwevents/collection";
import { randomId, randomSecret } from "@/lib/random";
import chunk from "lodash/chunk";
import { executePromiseQueue } from "@/lib/utils/asyncUtils";
import { getUnsubscribeAllUrlFromToken, renderUnsubscribeLinkTemplateForBulk, sendMailgunBatchEmail } from "@/server/mailgun/mailgunSend";

type AudienceRow = { userId: string; email: string };

type MailgunRiskLevel = "low" | "medium" | "high";

type AudienceFilter = {
  verifiedEmailOnly: boolean;
  requireMailgunValid: boolean;
  excludeUnsubscribed: boolean;
  excludeDeleted: boolean;
  onlyAdmins: boolean;
  maxMailgunRisk?: MailgunRiskLevel | null;
  includeUnknownRisk: boolean;
};

const DEFAULT_BATCH_SIZE = 1000;
const DEFAULT_CONCURRENCY = 20;
const EMAIL_SEND_EVENT_NAME = "adminEmailSend";

function assertAdmin(context: ResolverContext) {
  if (!userIsAdmin(context.currentUser)) {
    throw new Error("You must be an admin to do this.");
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function allowedRisksForMax(maxRisk: MailgunRiskLevel): string[] {
  if (maxRisk === "low") return ["low"];
  if (maxRisk === "medium") return ["low", "medium"];
  return ["low", "medium", "high"];
}

function buildAudienceWhereSql(filter: AudienceFilter) {
  const where: string[] = [];
  if (filter.excludeDeleted) where.push(`u."deleted" IS NOT TRUE`);
  if (filter.excludeUnsubscribed) where.push(`u."unsubscribeFromAll" IS NOT TRUE`);
  if (filter.onlyAdmins) where.push(`u."isAdmin" IS TRUE`);
  where.push(`u."email" IS NOT NULL AND btrim(u."email") <> ''`);

  if (filter.verifiedEmailOnly) {
    // Require that the primary email (u.email) appears in u.emails[] as verified=true.
    where.push(`
      EXISTS (
        SELECT 1
        FROM unnest(coalesce(u."emails", array[]::jsonb[])) e
        WHERE coalesce((e->>'verified')::boolean, false) IS TRUE
          AND lower(btrim(e->>'address')) = lower(btrim(u."email"))
      )
    `);
  }

  return where.length ? `WHERE ${where.join(" AND ")}` : "";
}

/**
 * Build SQL conditions for MailgunValidations filtering using EXISTS subqueries.
 * Note: Emails in MailgunValidations are stored lowercase, so we only need to
 * normalize the user's email. This allows the query to use the index on email.
 */
function buildMailgunFilterSql(filter: AudienceFilter): string {
  // Build conditions that must be met by a validation record
  const validationConds: string[] = [];
  if (filter.requireMailgunValid) {
    validationConds.push(`mv."isValid" IS TRUE`);
  }
  if (filter.maxMailgunRisk) {
    validationConds.push(`mv.risk = ANY($(allowedRisks))`);
  }

  // If no mailgun requirements and includeUnknownRisk, no filter needed
  if (validationConds.length === 0 && filter.includeUnknownRisk) {
    return "";
  }

  // If we just need to exclude unknown risk (no other requirements)
  if (validationConds.length === 0 && !filter.includeUnknownRisk) {
    return `AND EXISTS (
      SELECT 1 FROM "MailgunValidations" mv
      WHERE mv.email = lower(btrim(u."email"))
      AND mv.risk IS NOT NULL AND mv.risk <> 'unknown'
    )`;
  }

  // We have validation requirements
  const validationWhere = validationConds.join(" AND ");

  if (filter.includeUnknownRisk) {
    // Include users who have matching validation OR have no validation at all
    return `AND (
      EXISTS (
        SELECT 1 FROM "MailgunValidations" mv
        WHERE mv.email = lower(btrim(u."email"))
        AND ${validationWhere}
      )
      OR NOT EXISTS (
        SELECT 1 FROM "MailgunValidations" mv2
        WHERE mv2.email = lower(btrim(u."email"))
      )
    )`;
  } else {
    // Require matching validation
    return `AND EXISTS (
      SELECT 1 FROM "MailgunValidations" mv
      WHERE mv.email = lower(btrim(u."email"))
      AND ${validationWhere}
    )`;
  }
}

async function fetchAudienceBatch(args: {
  filter: AudienceFilter;
  limit: number;
  afterUserId?: string | null;
  runId?: string | null;
}): Promise<AudienceRow[]> {
  const db = getSqlClientOrThrow();
  const { filter, limit, afterUserId, runId } = args;

  const whereSql = buildAudienceWhereSql(filter);
  const afterSql = afterUserId ? `AND u._id > $(afterUserId)` : "";
  const mailgunFilterSql = buildMailgunFilterSql(filter);

  const skipAlreadySentSql = runId
    ? `
      AND NOT EXISTS (
        SELECT 1
        FROM "LWEvents" e
        WHERE e.name = '${EMAIL_SEND_EVENT_NAME}'
          AND e."documentId" = $(runId)
          AND e."userId" = u._id
          AND (e."properties"->>'status') = 'sent'
      )
    `
    : "";

  const sql = `
    -- adminEmailSenderResolvers.fetchAudienceBatch
    SELECT u._id AS "userId", lower(btrim(u."email")) AS email
    FROM "Users" u
    ${whereSql}
    ${afterSql}
    ${mailgunFilterSql}
    ${skipAlreadySentSql}
    ORDER BY u._id
    LIMIT $(limit)
  `;

  const params: Record<string, number | string | string[]> = { limit };
  if (afterUserId) params.afterUserId = afterUserId;
  if (filter.maxMailgunRisk) params.allowedRisks = allowedRisksForMax(filter.maxMailgunRisk);
  if (runId) params.runId = runId;

  return db.any<AudienceRow>(sql, params);
}

async function countAudience(filter: AudienceFilter): Promise<number> {
  const db = getSqlClientOrThrow();
  const whereSql = buildAudienceWhereSql(filter);
  const mailgunFilterSql = buildMailgunFilterSql(filter);

  const params: Record<string, string[]> = {};
  if (filter.maxMailgunRisk) params.allowedRisks = allowedRisksForMax(filter.maxMailgunRisk);

  const row = await db.one<{ count: string }>(
    `
      -- adminEmailSenderResolvers.countAudience
      SELECT COUNT(*)::text AS count
      FROM "Users" u
      ${whereSql}
      ${mailgunFilterSql}
    `,
    params,
  );
  return Number(row.count);
}

async function bulkCreateUnsubscribeAllTokens(args: {
  userIds: string[];
}): Promise<Record<string, string>> {
  const now = new Date();
  const mapping: Record<string, string> = {};

  const ops = args.userIds.map((userId) => {
    const token = randomSecret();
    mapping[userId] = token;
    return {
      insertOne: {
        document: {
          _id: randomId(),
          schemaVersion: 1,
          legacyData: null,
          createdAt: now,
          token,
          tokenType: "unsubscribeAll" as const,
          userId,
          usedAt: null,
          params: null,
        },
      },
    };
  });

  for (const batch of chunk(ops, 1000)) {
    await EmailTokens.rawCollection().bulkWrite(batch);
  }

  return mapping;
}

async function recordBulkEmailSentEvents(args: {
  runId: string;
  subject: string;
  userRows: AudienceRow[];
  batch: number;
}): Promise<void> {
  const now = new Date();
  const ops = args.userRows.map((r) => ({
    insertOne: {
      document: {
        _id: randomId(),
        schemaVersion: 1,
        legacyData: null,
        createdAt: now,
        name: EMAIL_SEND_EVENT_NAME,
        documentId: args.runId,
        userId: r.userId,
        important: false,
        intercom: false,
        properties: {
          status: "sent",
          email: r.email,
          batch: args.batch,
          subject: args.subject,
        },
      },
    },
  }));

  for (const batchOps of chunk(ops, 1000)) {
    await LWEvents.rawCollection().bulkWrite(batchOps);
  }
}

export const graphqlTypeDefs = gql`
  enum MailgunRiskLevel {
    low
    medium
    high
  }

  input AdminEmailAudienceFilterInput {
    verifiedEmailOnly: Boolean!
    requireMailgunValid: Boolean!
    excludeUnsubscribed: Boolean!
    excludeDeleted: Boolean!
    onlyAdmins: Boolean!
    maxMailgunRisk: MailgunRiskLevel
    includeUnknownRisk: Boolean!
  }

  input AdminEmailPreviewAudienceInput {
    filter: AdminEmailAudienceFilterInput!
  }

  input AdminSendTestEmailInput {
    userId: String!
    subject: String!
    from: String
    html: String
    text: String
  }

  input AdminSendBulkEmailInput {
    filter: AdminEmailAudienceFilterInput!
    subject: String!
    from: String
    html: String
    text: String
    maxRecipients: Int
    batchSize: Int
    concurrency: Int
    runId: String
  }

  type AdminEmailAudienceRow {
    userId: String!
    email: String!
  }

  type AdminEmailAudiencePreview {
    totalCount: Int!
    sample: [AdminEmailAudienceRow!]!
  }

  type AdminSendTestEmailResult {
    ok: Boolean!
    status: Int
    email: String!
    unsubscribeUrl: String!
  }

  type AdminSendBulkEmailError {
    batch: Int!
    status: Int
  }

  type AdminSendBulkEmailResult {
    ok: Boolean!
    runId: String!
    processed: Int!
    batches: Int!
    errors: [AdminSendBulkEmailError!]!
    lastAfterUserId: String
  }

  extend type Query {
    adminEmailPreviewAudience(input: AdminEmailPreviewAudienceInput!): AdminEmailAudiencePreview!
  }

  extend type Mutation {
    adminSendTestEmail(input: AdminSendTestEmailInput!): AdminSendTestEmailResult!
    adminSendBulkEmail(input: AdminSendBulkEmailInput!): AdminSendBulkEmailResult!
  }
`;

export const graphqlQueries = {
  async adminEmailPreviewAudience(
    _root: void,
    { input }: { input: { filter: AudienceFilter } },
    context: ResolverContext,
  ) {
    assertAdmin(context);
    const totalCount = await countAudience(input.filter);
    const sample = await fetchAudienceBatch({ filter: input.filter, limit: 20, afterUserId: null });
    return { totalCount, sample };
  },
};

export const graphqlMutations = {
  async adminSendTestEmail(
    _root: void,
    { input }: { input: { userId: string; subject: string; from?: string | null; html?: string | null; text?: string | null } },
    context: ResolverContext,
  ) {
    assertAdmin(context);
    const user = await context.Users.findOne({ _id: input.userId });
    if (!user) throw new Error("User not found");
    const email = user.email ? normalizeEmail(user.email) : null;
    if (!email) throw new Error("User has no email");

    const tokenMap = await bulkCreateUnsubscribeAllTokens({ userIds: [user._id] });
    const unsubscribeUrl = getUnsubscribeAllUrlFromToken(tokenMap[user._id]);

    const html = input.html ? input.html.replaceAll("{{unsubscribeUrl}}", unsubscribeUrl) : null;
    const text = input.text ? input.text.replaceAll("{{unsubscribeUrl}}", unsubscribeUrl) : null;

    const { ok, status } = await sendMailgunBatchEmail({
      subject: input.subject,
      from: input.from ?? undefined,
      to: [email],
      html,
      text,
      recipientVariables: { [email]: { unsubscribeUrl } },
    });

    return { ok, status, email, unsubscribeUrl };
  },

  async adminSendBulkEmail(
    _root: void,
    { input }: {
      input: {
        filter: AudienceFilter;
        subject: string;
        from?: string | null;
        html?: string | null;
        text?: string | null;
        maxRecipients?: number | null;
        batchSize?: number | null;
        concurrency?: number | null;
        runId?: string | null;
      };
    },
    context: ResolverContext,
  ) {
    assertAdmin(context);

    const batchSize = input.batchSize ?? DEFAULT_BATCH_SIZE;
    const concurrency = input.concurrency ?? DEFAULT_CONCURRENCY;
    const maxRecipients = input.maxRecipients ?? 100_000;
    const runId = input.runId ?? randomId();

    const htmlTemplate = input.html ? renderUnsubscribeLinkTemplateForBulk(input.html) : null;
    const textTemplate = input.text ? renderUnsubscribeLinkTemplateForBulk(input.text) : null;

    let afterUserId: string | null = null;
    let processed = 0;
    let batches = 0;
    const errors: Array<{ batch: number; status: number | null }> = [];

    // We prefetch up to (batchSize * concurrency) recipients at a time and then
    // send each batch concurrently. This keeps throughput high without a full queue.
    while (processed < maxRecipients && errors.length === 0) {
      const fetchLimit = Math.min(batchSize * Math.max(1, concurrency), maxRecipients - processed);
      const rows = await fetchAudienceBatch({
        filter: input.filter,
        limit: fetchLimit,
        afterUserId,
        runId,
      });
      if (rows.length === 0) break;

      afterUserId = rows[rows.length - 1].userId;
      const rowBatches = chunk(rows, batchSize);

      await executePromiseQueue(
        rowBatches.map((batchRows) => async () => {
          const thisBatchIndex = (batches += 1);
          const userIds = batchRows.map((r) => r.userId);
          const tokenByUserId = await bulkCreateUnsubscribeAllTokens({ userIds });

          const recipientVariables: Record<string, { unsubscribeUrl: string }> = {};
          const to: string[] = [];
          for (const r of batchRows) {
            const token = tokenByUserId[r.userId];
            const unsubscribeUrl = getUnsubscribeAllUrlFromToken(token);
            to.push(r.email);
            recipientVariables[r.email] = { unsubscribeUrl };
          }

          const { ok, status } = await sendMailgunBatchEmail({
            subject: input.subject,
            from: input.from ?? undefined,
            to,
            html: htmlTemplate,
            text: textTemplate,
            recipientVariables,
          });

          if (!ok) {
            errors.push({ batch: thisBatchIndex, status });
            return;
          }

          await recordBulkEmailSentEvents({
            runId,
            subject: input.subject,
            userRows: batchRows,
            batch: thisBatchIndex,
          });

          processed += batchRows.length;
        }),
        Math.max(1, concurrency),
      );
    }

    return {
      ok: errors.length === 0,
      runId,
      processed,
      batches,
      errors,
      lastAfterUserId: afterUserId,
    };
  },
};


