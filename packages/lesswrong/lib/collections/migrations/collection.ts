import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'
import { forumTypeSetting } from '../../instanceSettings';

/*
 * NOTE: This collection only tracks the use of migrations located in
 * server/manualMigrations. Automatic migrations that are run with
 * yarn migration up/down are tracked by the Postgres table migration_log.
 * Since this process is automatic, this is not used as a collection.
 * Instead see server/migrations/meta/PgStorage.
 */

// A collection which records whenever a migration is run, when it started and
// finished, and whether it succeeded. This can be cross-checked against the
// set of available migrations to find ones that need running.

const schema: SchemaType<DbMigration> = {
  name: {
    type: String,
  },
  started: {
    type: Date,
  },
  finished: {
    type: Date,
  },
  succeeded: {
    type: Boolean,
  },
};

export const Migrations: MigrationsCollection = createCollection({
  collectionName: "Migrations",
  typeName: "Migration",
  collectionType: forumTypeSetting.get() === 'EAForum' ? 'switching' : 'mongo',
  schema,
  //resolvers: getDefaultResolvers("Migrations"),
  //mutations: getDefaultMutations("Migrations"),
});
addUniversalFields({collection: Migrations});

export default Migrations;
