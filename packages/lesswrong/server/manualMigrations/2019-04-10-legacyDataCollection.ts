import { registerMigration, migrateDocuments } from "@/lib/server/manualMigrations/migrationUtils";
import { LegacyData } from "@/lib//lib/collections/legacyData/collection";
import { Comments } from "@/lib//lib/collections/comments/collection";
import { Posts } from "@/lib//lib/collections/posts/collection";
import Users from "@/lib//lib/collections/users/collection";
import * as _ from "underscore";
export default registerMigration({
    name: "moveLegacyData",
    dateWritten: "2019-04-10",
    idempotent: true,
    action: async () => {
        for (let collection of [Comments, Posts, Users]) {
            await migrateDocuments({
                description: "Move legacyData to legacyData collection",
                collection: collection,
                batchSize: 100,
                unmigratedDocumentQuery: {
                    legacyData: { $exists: true },
                },
                migrate: async (documents) => {
                    // Write legacyData into legacyData table
                    const addNewUpdates = _.map(documents, (doc: any): any => {
                        return {
                            insertOne: {
                                objectId: doc._id,
                                collectionName: collection.collectionName,
                                legacyData: doc.legacyData
                            }
                        };
                    });
                    await LegacyData.rawCollection().bulkWrite(addNewUpdates, { ordered: false });
                    // Remove legacyData from the other collection
                    const removeOldUpdates = _.map(documents, (doc: any): any => {
                        return {
                            updateOne: {
                                filter: { _id: doc._id },
                                update: {
                                    $unset: { legacyData: "" }
                                }
                            }
                        };
                    });
                    await collection.rawCollection().bulkWrite(removeOldUpdates, { ordered: false });
                },
            });
        }
    }
});
