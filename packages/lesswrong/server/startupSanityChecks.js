import { DatabaseMetadata } from '../lib/collections/databaseMetadata/collection.js';
import { registerSetting, getSetting } from 'meteor/vulcan:core';
import process from 'process';

registerSetting('expectedDatabaseId', null, "Database ID string that this config file should match with");

Meteor.startup(() => {
  const expectedDatabaseId = getSetting('expectedDatabaseId', null);
  const databaseIdObject = DatabaseMetadata.findOne({ name: "databaseId" });
  
  // If either the database or the settings config file contains an ID, then
  // both must contain IDs and they must match.
  if (expectedDatabaseId || databaseIdObject) {
    if (expectedDatabaseId !== databaseIdObject?.value) {
      console.error("Database ID in config file and in database don't match.");
      console.error(`    Database ID: ${databaseIdObject?.value}`);
      console.error(`    Expected database ID: ${expectedDatabaseId}`);
      console.error("If you are connecting to a production DB, you must use a matching config file. If you are *not* connecting to a production DB, you should not use a production config file.");
      process.exit(1);
    }
  }
});

