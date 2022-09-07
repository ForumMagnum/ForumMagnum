import Query from "./Query";
import Table from "./Table";

class DeleteQuery<T extends DbObject> extends Query<T> {
  constructor(
    table: Table,
    selector: string | MongoSelector<T>,
    options?: MongoRemoveOptions<T>, // TODO: What can options be?
  ) {
    super(table, ["DELETE FROM", table, "WHERE"]);

    if (typeof selector === "string") {
      selector = {_id: selector};
    }

    if (!Object.keys(selector).length) {
      throw new Error("You're trying to delete every record in a table - this is probably incorrect");
    }

    this.appendSelector(selector);
  }
}

export default DeleteQuery;
