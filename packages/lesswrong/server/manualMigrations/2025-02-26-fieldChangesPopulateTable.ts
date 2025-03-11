/* eslint-disable no-console */
import { bulkRawInsert, registerMigration } from "./migrationUtils";
import LWEvents from "@/lib/collections/lwevents/collection";
import { executePromiseQueue, sleep } from "@/lib/utils/asyncUtils";
import { FieldChanges } from "@/lib/collections/fieldChanges/collection";
import chunk from 'lodash/chunk';
import { randomId } from "@/lib/random";

export default registerMigration({
  name: "fieldChangesPopulateTable",
  dateWritten: "2025-02-26",
  idempotent: true,
  action: async () => {
    // Transfers field-changes from LWEvents to the dedicated FieldChanges
    // collection. Note that LWEvents is an _extremely_ large table, mostly due
    // to event types that are not this one, and queries against it must be
    // made with great care lest they time out and cause problems for the
    // database server.
    // Also note that development DBs may be created by cloning a production
    // DB with LWEvents omitted, which complicates performance testing. 

    console.log("Loading field changes from the LWEvents table");
    const fieldChangesFromLWEvents = await LWEvents.find({
      name: "fieldChanges"
    }).fetch();
    
    console.log(`Got ${fieldChangesFromLWEvents.length} field-change events`);
    console.log("Inserting field changes into the FieldChanges table");
    const batches = chunk(fieldChangesFromLWEvents.flatMap((lwEvent) => {
      const changeGroupId = lwEvent._id;
      return Object.keys(lwEvent.properties.after).map(fieldName => ({
        _id: randomId(),
        userId: lwEvent.userId,
        changeGroup: changeGroupId,
        documentId: lwEvent.documentId,
          createdAt: lwEvent.createdAt,
        fieldName,
        oldValue: lwEvent.properties.before[fieldName],
        newValue: lwEvent.properties.after[fieldName],
        legacyData: null,
        schemaVersion: 1,
      }));
    }), 50);
    
    await executePromiseQueue(batches.map((batch) => async () => {
      await bulkRawInsert("FieldChanges", batch);
    }), 10);
    
    console.log("Removing field changes from the LWEvents table");
    await LWEvents.rawRemove({ name: "fieldChanges" });
  },
});
