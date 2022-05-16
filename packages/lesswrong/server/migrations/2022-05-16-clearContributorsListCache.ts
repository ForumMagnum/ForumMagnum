import { registerMigration } from './migrationUtils';
import { clearAllDenormalizedContributorLists } from '../resolvers/tagResolvers';

registerMigration({
  name: "clearContributorsListCache",
  dateWritten: "2022-05-16",
  idempotent: true,
  action: async () => {
    await clearAllDenormalizedContributorLists();
  }
});
