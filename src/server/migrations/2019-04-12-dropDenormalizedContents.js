import { registerMigration, dropUnusedField } from './migrationUtils';
import { editableCollections, editableCollectionsFields } from '../../lib/editor/make_editable'
import { getCollection } from 'meteor/vulcan:core'

registerMigration({
  name: "dropDenormalizedContents",
  idempotent: true,
  action: async () => {
    for (let collectionName of editableCollections) {
      for (let editableField of editableCollectionsFields[collectionName]) {
        // eslint-disable-next-line no-console
        console.log(`Dropping denormalized part of ${collectionName}.${editableField}...`);
        
        const collection = getCollection(collectionName);
        await dropUnusedField(collection, editableField);
      }
    }
  }
});