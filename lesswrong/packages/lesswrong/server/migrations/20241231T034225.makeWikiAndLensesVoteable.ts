import { MultiDocuments } from "@/lib/collections/multiDocuments/collection";
import Tags from "@/lib/collections/tags/collection"
import { addField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addVoteableFieldsTo(db, Tags);
  await addVoteableFieldsTo(db, MultiDocuments);
}

async function addVoteableFieldsTo(db: SqlClient, collection: CollectionBase<any>) {
  await addField(db, collection, "voteCount");
  await addField(db, collection, "score");
  await addField(db, collection, "baseScore");
  await addField(db, collection, "extendedScore");
  await addField(db, collection, "inactive");
  await addField(db, collection, "afBaseScore");
  await addField(db, collection, "afExtendedScore");
  await addField(db, collection, "afVoteCount");
}

export const down = async ({db}: MigrationContext) => {
}
