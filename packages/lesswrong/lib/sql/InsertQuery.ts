import Query, { Atom } from "./Query";
import Table from "./Table";
import { Type } from "./Type";
import { randomId } from '../random';

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

/**
 * Builds a Postgres query to insert some specific data into the given table.
 *
 * `data` may be either a single collection object to insert, or an array of
 * objects.
 *
 * By default, a primary key conflict will result in an error being thrown when
 * the query is executed. To change this behaviour, `sqlOptions` may be used to
 * either ignore the conflict, or to enable upserting.
 *
 * When upserting, you can also supply an optional `upsertSelector` to test for
 * conflicts on fields other than the primary key, but note that, like Mongo, a
 * unique index must exist on exactly those fields to work. In general, this
 * should be considered fragile; 1) because of the requirement for a unique index
 * (meaning that indexes define the behaviour of the query, not just the speed), and
 * 2) because Mongo and Postgres have different opinions on how conflicts should be
 * treated on null fields which means we have to do some magic with `COALESCE` to make
 * things backwards compatible (see CreateIndexQuery). If you use upserting, test it
 * well!
 */
class InsertQuery<T extends DbObject> extends Query<T> {
  constructor(
    table: Table,
    data: T | T[],
    _options: MongoInsertOptions<T> = {}, // TODO: What can options be?
    sqlOptions?: InsertSqlOptions<T>,
  ) {
    super(table, [`INSERT INTO "${table.getName()}"`]);
    data = Array.isArray(data) ? data : [data];
    if (data.length === 1 && sqlOptions?.upsertSelector) {
      data[0] = {...data[0], ...sqlOptions?.upsertSelector};
    }
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
    } else if (sqlOptions?.conflictStrategy === "upsert") {
      // Tell the caller whether they updated or inserted
      this.atoms.push(`RETURNING CASE WHEN xmax::TEXT::INT > 0 THEN 'updated' ELSE 'inserted' END AS "action"`);
    }
  }

  private appendValuesList(data: T[]): void {
    if (!data.length) {
      throw new Error("Empty insert data");
    }
    const fields = this.table.getFields();
    this.atoms.push("(");
    let prefix = "";
    for (const key in fields) {
      this.atoms.push(`${prefix}"${key}"`);
      prefix = ", ";
    }
    this.atoms.push(") VALUES");
    prefix = "";
    for (const item of data) {
      this.atoms.push(prefix);
      this.appendItem(fields, item);
      prefix = ",";
    }
  }

  private appendItem(fields: Record<string, Type>, item: T): void {
    let prefix = "(";
    for (const key in fields) {
      this.atoms.push(prefix);
      if (key === "_id" && !item[key]) {
        item[key] = randomId();
      }
      this.atoms.push(this.createArg(item[key] ?? null, fields[key]));
      prefix = ", ";
    }
    this.atoms.push(")");
  }

  private compileUpsert(data: T, selector?: MongoSelector<T>): Atom<T>[] {
    let result: Atom<T>[] = ["ON CONFLICT ("];

    if (selector) {
      result.push(Object.keys(selector).map((field) => this.getConflictField(field)).join(","));
    } else {
      result.push("_id");
    }

    result.push(") DO UPDATE SET");

    result = result.concat(Object.keys(data)
      .flatMap((key) => key === "_id" ? [] : [",", `"${key}" =`, this.createArg(data[key])])
      .slice(1));

    return result;
  }

  private getConflictField(fieldName: string): string {
    const resolved = this.resolveFieldName(fieldName);
    const type = this.table.getField(fieldName);
    const coalesceValue = type?.getIndexCoalesceValue();
    return coalesceValue
      ? `COALESCE(${resolved}, ${coalesceValue})`
      : resolved;
  }
}

export default InsertQuery;
