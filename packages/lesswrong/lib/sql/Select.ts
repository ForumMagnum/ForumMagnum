import { Type, StringType } from "./Type";
import Table from "./Table";
import Clause from "./Clause";

type SortOptions = Record<string, 1|-1>;

class Select<T extends DbObject> {
  constructor(
    private table: Table,
    private selector: MongoSelector<T> = {},
    private options: MongoFindOneOptions<T> = {},
  ) {}

  toSQL(sql: SqlClient) {
    const selector = this.compileSelector(this.selector);
    const sort = this.compileSort(this.options.sort);
    const query = new Clause(
      [`SELECT id as _id, * FROM "${this.table.getName()}"`, sort],
      [selector],
    );
    const {sql: sqlQuery, args} = query.compile();
    return sql.unsafe(sqlQuery, args);
  }

  private compileSelector(selector: MongoSelector<T>) {
    const clauses: Clause[] = [];
    for (const key in selector) {
      const field = key === "_id" ? "id" : key;
      const type = this.table.getField(field);
      if (type) {
        clauses.push(this.toFieldSelector(field, type, selector[key]));
      } else {
        throw new Error(`Invalid selector: ${JSON.stringify(this.selector)}`);
      }
    }
    return Clause.join(clauses, "AND", "WHERE");
  }

  private toFieldSelector(field: string, type: Type, match: MongoSelector<T>) {
    if (typeof match === "string") {
      return new Clause([`"${field}" = `], [match]);
    }

    throw new Error(`Invalid field selector: ${field}: ${JSON.stringify(match)}`);
  }

  private compileSort(fields?: SortOptions) {
    const sorts: string[] = [];
    for (const field in fields) {
      sorts.push(`"${field === "_id" ? "id" : field}" ${fields[field] > 0 ? "ASC" : "DESC"}`);
    }
    return sorts.length ? "ORDER BY " + sorts.join(", ") : "";
  }
}

export default Select;
