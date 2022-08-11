import { Type, StringType } from "./Type";
import Table from "./Table";
import Clause from "./Clause";

class Select<T extends DbObject> {
  constructor(private table: Table, private selector: MongoSelector<T>) {}

  toSQL(sql: SqlClient) {
    const selector = this.compileSelector(sql, this.selector);
    const query = new Clause([`SELECT * FROM "${this.table.getName()}" WHERE`], [selector]);
    const {sql: sqlQuery, args} = query.compile();
    return sql.unsafe(sqlQuery, args);
  }

  private compileSelector(sql: SqlClient, selector: MongoSelector<T>) {
    const keys = Object.keys(this.selector);
    if (keys.length !== 1) {
      throw new Error("Invalid selector keys");
    }

    const field = keys[0] === "_id" ? "id" : keys[0];
    const type = this.table.getField(field);
    if (type) {
      return this.toFieldSelector(field, type, this.selector[keys[0]]);
    }

    throw new Error(`Invalid selector: ${JSON.stringify(this.selector)}`);
  }

  private toFieldSelector(field: string, type: Type, match: MongoSelector<T>) {
    if (typeof match === "string") {
      return new Clause([`"${field}" = `], [match]);
    }

    throw new Error(`Invalid field selector: ${field}: ${JSON.stringify(match)}`);
  }
}

export default Select;
