import { container, injectable } from "tsyringe";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { isValidCollectionName } from "../vulcan-lib";

container.register<SqlClient>("db", {useFactory: getSqlClientOrThrow});

/**
 * abstractRepo provides the superclass from which all of our collection
 * repositories are descended. Any common properties or functions
 * should be added here.
 *
 * We wrap it in a function in order to have a static method return
 * type `T`.
 *
 * There's also the `abstractRepo.register` decorator which should be
 * used on subclasses to properly setup dependency injection.
 *
 * The expected usage is:
 * ```
 * import abstractRepo from "./AbstractRepo";
 * @abstractRepo.register()
 * class FooRepo extends abstractRepo<FooRepo>() {
 *   getFoos(): Promise<DbFoo[]> {
 *     return this.db.any("SELECT * FROM foo");
 *   }
 * }
 * ```
 * then
 * ```
 * const fooRepo = FooRepo.resolve();
 * const foos = await fooRepo.getFoos();
 * ```
 *
 * To make the repo available in GraphQL resolvers, add it to `getAllRepos`
 * in index.ts
 */
const abstractRepo = <T>() => {
  abstract class Repo {
    protected db: SqlClient;

    constructor() {
      this.db = container.resolve("db");
      if (!this.db) {
        const {name} = this.constructor;
        throw new Error(`Couldn't resolve database connection for ${name}`);
      }
    }

    static resolve(): T {
      return container.resolve(this.constructor.name);
    }
  }

  return Repo;
}

abstractRepo.register = () => {
  return (target: { new (...args: any[]): unknown; constructor?: any; }) => {
    container.register(target.constructor.name, {useClass: target});
    return injectable()(target);
  }
}

export default abstractRepo;
