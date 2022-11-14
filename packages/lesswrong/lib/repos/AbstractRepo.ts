import { container, injectable } from "tsyringe";

/**
 * AbstractRepo is the superclass from which all of our collection
 * repositories are descended. Any common properties or functions
 * should be added here.
 *
 * We wrap it in a function in order to have a static method return
 * type `T`.
 *
 * There's also the `AbstractRepo.register` decorator which should be
 * used on subclasses to properly setup dependency injection.
 *
 * The expected usage is:
 * ```
 * import AbstractRepo from "./AbstractRepo";
 * @AbstractRepo.register()
 * class FooRepo extends AbstractRepo<FooRepo>() {
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
 */
const AbstractRepo = <T>() => {
  abstract class Repo {
    protected container = container;
    protected db: SqlClient;

    constructor() {
      this.db = container.resolve("db");
      if (!this.db) {
        throw new Error("Couldn't resolve database connection");
      }
    }

    static resolve(): T {
      return container.resolve(this.constructor.name);
    }
  }

  return Repo;
}

AbstractRepo.register = () => {
  return (target: { new (...args: any[]): unknown; constructor?: any; }) => {
    container.register(target.constructor.name, {useClass: target});
    return injectable()(target);
  }
}

export default AbstractRepo;
