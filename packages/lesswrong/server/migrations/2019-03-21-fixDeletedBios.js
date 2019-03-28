import { registerMigration } from './migrationUtils';
import { recomputeDenormalizedValues } from '../scripts/recomputeDenormalized';

registerMigration({
  name: "fixDeletedBios",
  idempotent: true,
  action: async () => {
    await recomputeDenormalizedValues("Users", "htmlBio");
  }
});