import { registerMigration } from './migrationUtils';

registerMigration({
  name: "fixRevisionFieldNameArray",
  dateWritten: "2020-07-04",
  idempotent: true,
  action: async () => {
    // For some reason (probably a bad earlier migration), some revisions have
    // their fieldName field contain a single-element array containing a string,
    // rather than the string itself. This is equivalent for queries, but may
    // cause other problems. Change those revisions to have the right type for
    // fieldName.
    // TODO
  }
});
