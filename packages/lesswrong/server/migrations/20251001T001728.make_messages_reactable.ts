import Messages from "../collections/messages/collection";
import { addField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Messages, "voteCount");
  await addField(db, Messages, "baseScore");
  await addField(db, Messages, "score");
  await addField(db, Messages, "extendedScore");
  await addField(db, Messages, "inactive");
  await addField(db, Messages, "afBaseScore");
  await addField(db, Messages, "afExtendedScore");
  await addField(db, Messages, "afVoteCount");
}

export const down = async ({db}: MigrationContext) => {
}
