import { fillDefaultValues, registerMigration } from './migrationUtils';
import Sequences from '../../lib/collections/sequences/collection';


export default registerMigration({
  name: "fillHideFromAuthorPage",
  dateWritten: "2021-11-27",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Sequences,
      fieldName: "hideFromAuthorPage",
    });  },
});

