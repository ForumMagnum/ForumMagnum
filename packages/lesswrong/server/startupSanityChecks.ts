import { isAnyTest } from '../lib/executionEnvironment';
import process from 'process';
import { DatabaseMetadata } from '../server/collections/databaseMetadata/collection';
import { PublicInstanceSetting } from '../lib/instanceSettings';
import { getPreloadedDatabaseId } from './loadDatabaseSettings';

// Database ID string that this config file should match with
const expectedDatabaseIdSetting = new PublicInstanceSetting<string | null>('expectedDatabaseId', null, "warning")

const loadDatabaseId = async () => {
  const databaseIdObject = await DatabaseMetadata.findOne({ name: "databaseId" });
  return databaseIdObject?.value || null;
}

export async function startupSanityChecks() {
  if (isAnyTest) return;
  const expectedDatabaseId = expectedDatabaseIdSetting.get();
  const preload = getPreloadedDatabaseId();
  const databaseId = preload.preloaded ? preload.databaseId : await loadDatabaseId();
  
  // If either the database or the settings config file contains an ID, then
  // both must contain IDs and they must match.
  if (expectedDatabaseId || databaseId) {
    if (expectedDatabaseId !== databaseId) {
      console.error("Database ID in config file and in database don't match."); // eslint-disable-line no-console
      console.error(`    Database ID: ${databaseId}`); // eslint-disable-line no-console
      console.error(`    Expected database ID: ${expectedDatabaseId}`); // eslint-disable-line no-console
      console.error("If you are connecting to a production DB, you must use a matching config file. If you are *not* connecting to a production DB, you should not use a production config file."); // eslint-disable-line no-console
      process.exit(1);
    }
  }
}

