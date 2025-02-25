import { registerMigration } from './migrationUtils';

// A migration which is a no-op. Used for testing bits of migration infrastructure.
export default registerMigration({
  name: "trivialMigration",
  dateWritten: "2019-12-02",
  idempotent: true,
  action: async () => {
    // eslint-disable-next-line no-console
    console.log("Running trivial migration");
  }
});
