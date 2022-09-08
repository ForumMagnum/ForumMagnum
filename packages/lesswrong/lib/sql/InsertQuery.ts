import Query, { Atom } from "./Query";
import Table from "./Table";

export type ConflictStrategy = "error" | "ignore" | "upsert";

type InsertSqlBaseOptions = Partial<{
  returnInserted: boolean,
}>

export type InsertSqlConflictOptions<T extends DbObject> = Partial<{
  conflictStrategy: Omit<ConflictStrategy, "upsert">,
  upsertSelector: never,
}> | {
  conflictStrategy: "upsert",
  upsertSelector?: MongoSelector<T>,
}

export type InsertSqlOptions<T extends DbObject> = InsertSqlBaseOptions & InsertSqlConflictOptions<T>;

class InsertQuery<T extends DbObject> extends Query<T> {
  constructor(
    table: Table,
    data: T | T[],
    _options: MongoInsertOptions<T> = {}, // TODO: What can options be?
    sqlOptions?: InsertSqlOptions<T>,
  ) {
    super(table, [`INSERT INTO "${table.getName()}"`]);
    data = Array.isArray(data) ? data : [data];
    this.appendValuesList(data);

    switch (sqlOptions?.conflictStrategy ?? "error") {
      case "error":
        break;
      case "ignore":
        this.atoms.push("ON CONFLICT DO NOTHING");
        break;
      case "upsert":
        if (data.length !== 1) {
          throw new Error("Cannot use conflictStrategy 'upsert' when inserting multiple rows");
        }
        this.atoms = this.atoms.concat(this.compileUpsert(data[0], sqlOptions?.upsertSelector));
        break;
    }

    if (sqlOptions?.returnInserted) {
      this.atoms.push("RETURNING *");
    }
  }

  private appendValuesList(data: T[]): void {
    const fields = this.table.getFields();
    const keys = Object.keys(fields);
    this.atoms.push("(");
    let prefix = "";
    for (const key of keys) {
      this.atoms.push(`${prefix}"${key}"`);
      prefix = ", ";
    }
    this.atoms.push(") VALUES");
    prefix = "";
    for (const item of data) {
      this.atoms.push(prefix);
      this.appendItem(keys, item);
      prefix = ",";
    }
  }

  private appendItem(keys: string[], item: T): void {
    let prefix = "(";
    for (const key of keys) {
      this.atoms.push(prefix);
      this.atoms.push(this.createArg(item[key] ?? null));
      prefix = ", ";
    }
    this.atoms.push(")");
  }

  private compileUpsert(data: T, selector?: MongoSelector<T>): Atom<T>[] {
    let result: Atom<T>[] = ["ON CONFLICT ("];

    if (selector) {
      result.push(Object.keys(selector).map((field) => this.resolveFieldName(field)).join(","));
    } else {
      result.push("_id");
    }

    result.push(") DO UPDATE SET");

    result = result.concat(Object.keys(data)
      .flatMap((key) => key === "_id" ? [] : [",", `"${key}" =`, this.createArg(data[key])])
      .slice(1));

    if (selector) {
      result.push("WHERE");
      result = result.concat(this.compileSelector(selector));
    }

    return result;
  }
}

export default InsertQuery;
