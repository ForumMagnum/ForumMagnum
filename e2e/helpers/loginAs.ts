import type { Browser} from "@playwright/test";
import { getMongoConnection } from "./mongoConnection";
import { createHash, randomBytes } from "crypto";

const hashLoginToken = (loginToken: string) => {
  const hash = createHash("sha256");
  hash.update(loginToken);
  return hash.digest("base64");
};

export const loginAs = async (browser: Browser, user: {_id: string}) => {
  const loginToken = randomBytes(16).toString("hex");

  const dbConnection = await getMongoConnection();
  const db = dbConnection.db();
  await db.collection("users").updateOne({_id: user._id}, {
    $addToSet: {
      "services.resume.loginTokens": {
        when: new Date(),
        hashedToken: hashLoginToken(loginToken),
      },
    },
  });

  const context = await browser.newContext();
  context.addCookies([{
    name: "loginToken",
    value: loginToken,
    url: "localhost:3000",
  }]);
}
