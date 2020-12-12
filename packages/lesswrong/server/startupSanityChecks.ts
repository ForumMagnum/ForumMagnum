import { onStartup } from '../lib/executionEnvironment';
import process from 'process';
import { DatabaseMetadata } from '../lib/collections/databaseMetadata/collection';
import { PublicInstanceSetting } from '../lib/instanceSettings';

// Database ID string that this config file should match with
const expectedDatabaseIdSetting = new PublicInstanceSetting<string | null>('expectedDatabaseId', null, "warning")

onStartup(async () => {
  const expectedDatabaseId = expectedDatabaseIdSetting.get();
  const databaseIdObject = await DatabaseMetadata.findOne({ name: "databaseId" });
  
  // If either the database or the settings config file contains an ID, then
  // both must contain IDs and they must match.
  if (expectedDatabaseId || databaseIdObject) {
    if (expectedDatabaseId !== databaseIdObject?.value) {
      console.error("Database ID in config file and in database don't match."); // eslint-disable-line no-console
      console.error(`    Database ID: ${databaseIdObject?.value}`); // eslint-disable-line no-console
      console.error(`    Expected database ID: ${expectedDatabaseId}`); // eslint-disable-line no-console
      console.error("If you are connecting to a production DB, you must use a matching config file. If you are *not* connecting to a production DB, you should not use a production config file."); // eslint-disable-line no-console
      process.exit(1);
    }
  }
});

