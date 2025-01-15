import Query from "./Query";
import Table from "./Table";
import SelectQuery from "./SelectQuery";

export type DeleteSqlOptions = Partial<{
  limit: number,
  noSafetyHarness: boolean,
}>

/**
 * Builds a Postgres query to delete data from the given table.
 *
 * If no selector is provided then the query will delete _all_ data from the table. To
 * prevent accidents, the query builder will throw an error if you try to do this but
 * this check can be disabled by passing in `{ noSafetyHarness: true }`.
 */
class DeleteQuery<T extends DbObject> extends Query<T> {
  constructor(
    table: Table<T>,
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
      const projection = {_id: 1} as MongoProjection<T>;
      const subquery = new SelectQuery(table, selector, {projection, limit: sqlOptions.limit});
      this.atoms = this.atoms.concat(["_id IN", subquery]);
    } else {
      this.appendSelector(selector);
    }
  }
}

export default DeleteQuery;
