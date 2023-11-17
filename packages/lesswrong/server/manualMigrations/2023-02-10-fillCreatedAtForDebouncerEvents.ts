import { registerMigration } from "./migrationUtils";
import { getDatabase } from "../../lib/mongoCollection";

registerMigration({
  name: "fillCreatedAtForDebouncerEvents",
  dateWritten: "2022-02-10",
  idempotent: true,
  action: async () => {
    const updates: any[] = [];
    const db = getDatabase();
    const collection = db.collection("debouncerevents");
    await collection.find({
      createdAt: {$exists: false},
      delayTime: {$exists: true},
    }).forEach((doc: DbDebouncerEvents) => {
      updates.push({
        updateOne: {
          filter: {_id: doc._id},
          update: {$set: {createdAt: new Date(doc.delayTime)}},
        },
      });
    });
    await collection.bulkWrite(updates);
  },
});
