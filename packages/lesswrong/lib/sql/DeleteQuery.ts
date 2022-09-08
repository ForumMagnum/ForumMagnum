import Query from "./Query";
import Table from "./Table";
import SelectQuery from "./SelectQuery";

export type DeleteSqlOptions = Partial<{
  limit: number,
  noSafetyHarness: boolean,
}>

class DeleteQuery<T extends DbObject> extends Query<T> {
  constructor(
    table: Table,
    selector: string | MongoSelector<T>,
    _options?: MongoRemoveOptions<T>, // TODO: What can options be?
    sqlOptions?: DeleteSqlOptions,
  ) {
    super(table, ["DELETE FROM", table]);

    if (typeof selector === "string") {
      selector = {_id: selector};
    }

    if (!Object.keys(selector).length) {
      if (sqlOptions?.noSafetyHarness) {
        return;
      } else {
        throw new Error("You're trying to delete every record in a table - this is probably incorrect");
      }
    }

    this.atoms.push("WHERE");

    if (sqlOptions?.limit) {
      this.nameSubqueries = false;
      const subquery = new SelectQuery(table, selector, {projection: {_id: 1}, limit: sqlOptions.limit});
      this.atoms = this.atoms.concat(["_id IN", subquery]);
    } else {
      this.appendSelector(selector);
    }
  }
}

export default DeleteQuery;
