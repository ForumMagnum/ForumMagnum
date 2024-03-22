import { createPostgresView } from "./postgresView";

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
  REFRESH MATERIALIZED VIEW "UserLoginTokens"
`;

createPostgresView(
  "UserLoginTokens",
  "every 5 minutes",
  createUserLoginTokensQuery,
  [createUserLoginTokensIndexQuery],
  refreshUserLoginTokensIndexQuery,
);
