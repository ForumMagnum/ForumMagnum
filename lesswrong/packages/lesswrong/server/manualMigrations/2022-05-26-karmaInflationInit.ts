import { registerMigration } from './migrationUtils';
import { refreshKarmaInflation } from '../karmaInflation/cron';

registerMigration({
  name: "karmaInflationInit",
  dateWritten: "2022-05-26",
  idempotent: true,
  action: async () => {
    await refreshKarmaInflation()
  },
});
