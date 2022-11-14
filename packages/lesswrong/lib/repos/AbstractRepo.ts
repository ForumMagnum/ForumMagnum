import { container, injectable } from "tsyringe";

abstract class AbstractRepo {
  protected container = container;
  protected db: SqlClient;

  constructor() {
    this.db = container.resolve("db");
    if (!this.db) {
      throw new Error("Couldn't resolve database connection");
    }
  }

  static resolve() {
    return container.resolve(this.constructor.name);
  }

  static register() {
    return (target: { new (...args: any[]): unknown; constructor?: any; }) => {
      container.register(target.constructor.name, {useClass: target});
      return injectable()(target);
    }
  }
}

export default AbstractRepo;
