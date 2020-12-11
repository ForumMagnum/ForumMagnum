import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'

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
  schema,
  //resolvers: getDefaultResolvers("Migrations"),
  //mutations: getDefaultMutations("Migrations"),
});
addUniversalFields({collection: Migrations});

export default Migrations;
