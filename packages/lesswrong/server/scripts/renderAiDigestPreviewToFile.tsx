/* eslint-disable no-console */
import { randomBytes } from "crypto";
import LoginTokens from "@/server/collections/loginTokens/collection";
import { hashLoginToken } from "@/server/loginTokens";
import Users from "@/server/collections/users/collection";

/**
 * Dev helper: creates a login token for an admin user on the dev database so
 * the AI digest email preview can be fetched from the running dev server
 * without a browser session. Prints the token to stdout.
 * Run with: yarn repl dev lw packages/lesswrong/server/scripts/renderAiDigestPreviewToFile.tsx "createAdminLoginTokenForPreview()"
 */
export async function createAdminLoginTokenForPreview() {
  const adminUser = await Users.findOne({ isAdmin: true, banned: null });
  if (!adminUser) {
    throw new Error("No admin user found in this database");
  }

  const token = randomBytes(32).toString("hex");
  await LoginTokens.rawInsert({
    createdAt: new Date(),
    userId: adminUser._id,
    hashedToken: hashLoginToken(token),
    loggedOutAt: null,
  });

  console.log(`admin: ${adminUser.displayName} (${adminUser._id})`);
  console.log(`LOGIN_TOKEN=${token}`);
}
