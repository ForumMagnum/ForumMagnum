require("ts-node/register");
require("./packages/lesswrong/server/migrations/meta/umzug")
  .createMigrator()
  .then((migrator) => migrator.runAsCLI().finally(process.exit));
