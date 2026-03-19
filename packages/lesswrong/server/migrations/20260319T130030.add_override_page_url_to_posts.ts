import { aboutPostIdSetting, contactPostIdSetting, faqPostIdSetting } from "@/lib/instanceSettings";
import Posts from "../collections/posts/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, "overridePageUrl");

  await addSpecialPostRoute(db, "/about", aboutPostIdSetting.get());
  await addSpecialPostRoute(db, "/contact", contactPostIdSetting.get());
  await addSpecialPostRoute(db, "/faq", faqPostIdSetting.get());
  await addSpecialPostRoute(db, "/donate", "LcpQQvcpWfPXvW7R9");
}

async function addSpecialPostRoute(db: SqlClient, path: string, postId: string) {
  await db.none(`UPDATE Posts SET overridePageUrl = $1 WHERE _id = $2`, [path, postId]);
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "overridePageUrl");
}
