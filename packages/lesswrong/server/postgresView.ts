import { getSqlClientOrThrow } from "./sql/sqlClient";
import { queryWithLock } from "./queryWithLock";
import { addCronJob, CronJobSpec } from "./cron/cronUtil";

type PostgresViewRefreshSpec = {
  interval: string,
  query: string,
}

export class PostgresView {
  private cronJob: CronJobSpec|null = null;

  constructor(
    private name: string,
    private createViewQuery: string,
    private createIndexQueries: string[] = [],
    private refreshSpec?: PostgresViewRefreshSpec,
    private dependencies?: SchemaDependency[],
    private queryTimeout = 60,
  ) {
    if (this.refreshSpec) {
      this.cronJob = addCronJob({
        name: `refreshPostgresView-${this.name}`,
        interval: this.refreshSpec.interval,
        job: () => this.refresh(getSqlClientOrThrow()),
      });
    }
  }

  getName(): string {
    return this.name;
  }

  getCreateViewQuery() {
    return this.createViewQuery;
  }

  getCreateIndexQueries() {
    return this.createIndexQueries;
  }

  getDependencies() {
    return this.dependencies;
  }

  async refresh(db: SqlClient) {
    if (this.refreshSpec) {
      await queryWithLock(db, this.refreshSpec.query, this.queryTimeout);
    }
  }

  getCronJob() {
    return this.cronJob;
  }
}

export const conversationUnreadMessagesView = new PostgresView(
  "ConversationUnreadMessages",
  `CREATE OR REPLACE VIEW "ConversationUnreadMessages" AS
    SELECT q."conversationId", q."userId", EXISTS (
      SELECT *
      FROM "Notifications" n
      INNER JOIN "Messages" m ON
        n."userId" = q."userId"
        AND n."documentId" = m."_id"
        AND n."documentType" = 'message'
        AND n."emailed" IS NOT TRUE
        AND n."waitingForBatch" IS NOT TRUE
        AND n."deleted" IS NOT TRUE
        AND n."viewed" IS NOT TRUE
        AND m."conversationId" = q."conversationId"
      ) "hasUnreadMessages"
    FROM (
      SELECT "_id" "conversationId", UNNEST("participantIds") "userId"
      FROM "Conversations"
    ) q
  `,
  [],
  undefined,
  [
    {type: "collection", name: "Notifications"},
    {type: "collection", name: "Messages"},
  ],
);


const createUserLoginTokensQuery = `
  CREATE MATERIALIZED VIEW IF NOT EXISTS "UserLoginTokens" AS
  SELECT
    JSONB_ARRAY_ELEMENTS("services"->'resume'->'loginTokens')->>'hashedToken' "hashedToken",
    "_id" "userId"
  FROM "Users"
  WHERE JSONB_TYPEOF("services"->'resume'->'loginTokens') = 'array'
`;

const createUserLoginTokensIndexQuery = `
  CREATE UNIQUE INDEX IF NOT EXISTS idx_user_login_tokens_hashed_token
  ON "UserLoginTokens"
  USING BTREE ("hashedToken")
`;

const refreshUserLoginTokensIndexQuery = `
  REFRESH MATERIALIZED VIEW CONCURRENTLY "UserLoginTokens"
`;

export const userLoginTokensView = new PostgresView(
  "UserLoginTokens",
  createUserLoginTokensQuery,
  [createUserLoginTokensIndexQuery],
  {
    interval: "every 5 minutes",
    query: refreshUserLoginTokensIndexQuery,
  },
  [
    {type: "collection", name: "Users"},
  ],
);


/**
 * The collaborative filter strategy requires comparing the sets of unique voters
 * on many different posts. This is too slow to do every time we need to generate
 * recommendations as it requires scanning the entire votes collection so we
 * precompute the data into this materialized view which is periodically refreshed
 * by a cron job.
 *
 * User ids are hashed into integers as this allows us to use the efficient union
 * and intersection methods from the intarray Postgres extension. Hashing collisions
 * are possible but not statistically significant.
 */
const createUniquePostUpvotersQuery = `
  CREATE MATERIALIZED VIEW IF NOT EXISTS "UniquePostUpvoters" AS
    SELECT
      p."_id" AS "postId",
      ARRAY_AGG(DISTINCT ('x' || SUBSTR(MD5(v."userId"), 1, 8))::BIT(32)::INTEGER)
        AS "voters"
    FROM "Posts" p
    INNER JOIN "Votes" v ON
      p."_id" = v."documentId" AND
      v."collectionName" = 'Posts' AND
      v."cancelled" IS NOT TRUE AND
      v."isUnvote" IS NOT TRUE AND
      v."voteType" IN ('smallUpvote', 'bigUpvote')
    GROUP BY p."_id"
`;

const createUniquePostUpvotersIndexQuery = `
  CREATE UNIQUE INDEX IF NOT EXISTS "idx_UniquePostUpvoters_postId"
    ON "UniquePostUpvoters" ("postId")
`;

const refreshUniquePostUpvotersQuery = `
  REFRESH MATERIALIZED VIEW "UniquePostUpvoters"
`;

export const uniquePostUpvotersView = new PostgresView(
  "UniquePostUpvoters",
  createUniquePostUpvotersQuery,
  [createUniquePostUpvotersIndexQuery],
  {
    interval: "every 1 hour",
    query: refreshUniquePostUpvotersQuery,
  },
  [
    {type: "extension", name: "intarray"},
    {type: "collection", name: "Posts"},
    {type: "collection", name: "Votes"},
  ],
);

export const getAllPostgresViews = () => [
  conversationUnreadMessagesView,
  userLoginTokensView,
  uniquePostUpvotersView,
];

