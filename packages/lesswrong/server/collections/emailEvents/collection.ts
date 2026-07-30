import schema from "@/lib/collections/emailEvents/newSchema";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";
import { createCollection } from "@/lib/vulcan-lib/collections";

export const EmailEvents = createCollection({
  collectionName: "EmailEvents",
  typeName: "EmailEvent",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    // Ingestion idempotency: Mailgun retries webhook deliveries.
    indexSet.addIndex("EmailEvents", { mailgunEventId: 1 }, { unique: true });
    indexSet.addIndex("EmailEvents", { userId: 1, occurredAt: -1 });
    indexSet.addIndex("EmailEvents", { emailType: 1, campaignId: 1 });
    return indexSet;
  },
});

export default EmailEvents;
