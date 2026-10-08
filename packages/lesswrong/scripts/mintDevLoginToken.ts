/* eslint-disable no-console */
import { randomBytes } from "crypto";
import Users from "@/server/collections/users/collection";
import LoginTokens from "@/server/collections/loginTokens/collection";
import { hashLoginToken } from "@/server/loginTokens";

export async function mintDevLoginToken() {
  const admin = await Users.findOne({ isAdmin: true }, { sort: { createdAt: 1 } });
  if (!admin) throw new Error("No admin user found");
  const token = randomBytes(32).toString("base64url");
  await LoginTokens.rawInsert({
    createdAt: new Date(),
    userId: admin._id,
    hashedToken: hashLoginToken(token),
    loggedOutAt: null,
  });
  console.log(`user: ${admin.displayName} (${admin._id})`);
  console.log(`loginToken: ${token}`);
}

export async function invalidateDevLoginToken(token: string) {
  await LoginTokens.rawUpdateMany(
    { hashedToken: hashLoginToken(token), loggedOutAt: null },
    { $set: { loggedOutAt: new Date() } },
  );
  console.log("Invalidated dev login token");
}
