import { createCollection } from "@/lib/vulcan-lib/collections";
import schema from "@/lib/collections/loginTokens/newSchema";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

/**
 * Tokens for logged in users, issued when they successfully log in (via any
 * auth method). This table replaces two previous systems: `services.resume`
 * on user objects, and the `UserLoginTokens` materialized view of those
 * objects.
 */
export const LoginTokens = createCollection({
  collectionName: "LoginTokens",
  typeName: "LoginToken",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex("LoginTokens", {hashedToken: 1}, {unique: true});
    indexSet.addIndex("LoginTokens", {userId: 1});
    return indexSet;
  },
});

export default LoginTokens;
