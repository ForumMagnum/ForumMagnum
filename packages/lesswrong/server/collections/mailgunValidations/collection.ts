import schema from "@/lib/collections/mailgunValidations/newSchema";
import { createCollection } from "@/lib/vulcan-lib/collections";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const MailgunValidations = createCollection({
  collectionName: "MailgunValidations",
  typeName: "MailgunValidation",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex(
      "MailgunValidations",
      { email: 1, mailboxVerification: 1 },
      { unique: true },
    );
    indexSet.addIndex("MailgunValidations", { email: 1, validatedAt: -1 });
    return indexSet;
  },
});


