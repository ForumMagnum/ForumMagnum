import { registerMigration, migrateDocuments } from "./migrationUtils";
import { DatabaseMetadata } from "../../lib/collections/databaseMetadata/collection";
import { EmailTokens } from "../../lib/collections/emailTokens/collection";
import FeaturedResources from "../../lib/collections/featuredResources/collection";
import LegacyData from "../../lib/collections/legacyData/collection";
import Podcasts from "../../lib/collections/podcasts/collection";
import PodcastEpisodes from "../../lib/collections/podcastEpisodes/collection";
import DebouncerEvents from "../../lib/collections/debouncerEvents/collection";
import Migrations from "../../lib/collections/migrations/collection";
import ReadStatuses from "../../lib/collections/readStatus/collection";
import { Votes } from "../../lib/collections/votes/collection";
import Revisions from "../../lib/collections/revisions/collection";

const initCreatedAt = <N extends CollectionNameString>(
  collection: CollectionBase<N>,
  existingField = "",
): Promise<void> =>
  migrateDocuments({
    collection,
    description: `Filling createdAt for ${collection.options.collectionName}`,
    batchSize: 2000,
    unmigratedDocumentQuery: {
      createdAt: {$exists: false},
    },
    migrate: async (documents: ObjectsByCollectionName[N][]) => {
      const updates = documents.map((document: ObjectsByCollectionName[N]) => ({
        updateOne: {
          filter: {_id: document._id},
          update: {
            $set: {
              createdAt: new Date((document as AnyBecauseObsolete)[existingField] ?? 0),
            },
          },
        },
      }));
      await collection.rawCollection().bulkWrite(updates, {ordered: false});
    },
    loadFactor: 0.8
  });

/**
 * This migration adds a 'createdAt' field to all collections that don't currently have one
 *
 * We use different approaches to fill the data for different collections.
 * For these collection we use the current date:
 *  - DatabaseMetadata
 *  - FeaturedResources
 *  - LegacyData
 *  - PodcastEpisodes
 *  - Podcasts
 *  - EmailTokens
 *  - ReadStatus
 * For these collection we copy an existing field:
 *  - DebouncerEvents (delayTime)
 *  - Migrations (started)
 *  - Revisions (editedAt)
 *  - Votes (votedAt)
 */
export default registerMigration({
  name: "giveAllCollectionsCreatedAt",
  dateWritten: "2022-09-08",
  idempotent: true,
  action: async () => {
    await initCreatedAt(DatabaseMetadata);
    await initCreatedAt(FeaturedResources);
    await initCreatedAt(LegacyData);
    await initCreatedAt(PodcastEpisodes);
    await initCreatedAt(Podcasts);
    await initCreatedAt(DebouncerEvents, "delayTime");
    await initCreatedAt(EmailTokens);
    await initCreatedAt(Migrations, "started");
    await initCreatedAt(ReadStatuses);
    await initCreatedAt(Revisions, "editedAt");
    await initCreatedAt(Votes, "votedAt");
  },
});
