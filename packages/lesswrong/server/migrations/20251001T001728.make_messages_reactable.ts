import Messages from "../collections/messages/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Messages, "voteCount");
  await addField(db, Messages, "baseScore");
  await addField(db, Messages, "score");
  await addField(db, Messages, "extendedScore");
  await addField(db, Messages, "afBaseScore");
  await addField(db, Messages, "afExtendedScore");
  await addField(db, Messages, "afVoteCount");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Messages, "voteCount");
  await dropField(db, Messages, "baseScore");
  await dropField(db, Messages, "score");
  await dropField(db, Messages, "extendedScore");
  await dropField(db, Messages, "afBaseScore");
  await dropField(db, Messages, "afExtendedScore");
  await dropField(db, Messages, "afVoteCount");
}
