import { registerMigration, dropUnusedField } from './migrationUtils';
import { getEditableCollectionNames, getEditableFieldNamesForCollection } from '../../lib/editor/make_editable'
import { getCollection } from '../vulcan-lib/getCollection';

export default registerMigration({
  name: "dropDenormalizedContents",
  dateWritten: "2019-04-12",
  idempotent: true,
  action: async () => {
    for (let collectionName of getEditableCollectionNames()) {
      for (let editableField of getEditableFieldNamesForCollection(collectionName)) {
        // eslint-disable-next-line no-console
        console.log(`Dropping denormalized part of ${collectionName}.${editableField}...`);
        
        const collection = getCollection(collectionName);
        await dropUnusedField(collection, editableField);
      }
    }
  }
});
