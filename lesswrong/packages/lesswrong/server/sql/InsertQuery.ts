import Query, { Atom } from "./Query";
import Table from "./Table";
import { Type } from "./Type";
import { randomId } from '@/lib/random';

export type InsertQueryData<T> = T & Partial<{
  $max: Partial<T>,
  $min: Partial<T>,
  $push: Partial<T>,
}>;

export type ConflictStrategy = "error" | "ignore" | "upsert";

type InsertSqlBaseOptions = Partial<{
  returnInserted: boolean,
}>

export type InsertSqlConflictOptions<T extends DbObject> = Partial<{
  conflictStrategy: Exclude<ConflictStrategy, "upsert">,
  upsertSelector: never,
}> | {
  conflictStrategy: "upsert",
  upsertSelector?: MongoSelector<T>,
}

export type InsertSqlOptions<T extends DbObject> = InsertSqlBaseOptions & InsertSqlConflictOptions<T>;

const UPSERT_OPERATORS = {
  $max: "GREATEST",
  $min: "LEAST",
  $push: "ARRAY_APPEND",
} as const;

type UpsertOperator = keyof typeof UPSERT_OPERATORS;

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
    table: Table<T>,
    data: InsertQueryData<T> | InsertQueryData<T>[],
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
    const usedOperators: Partial<Record<keyof T, UpsertOperator>> = {};
    for (const operator in UPSERT_OPERATORS) {
      if ((item as AnyBecauseTodo)[operator]) {
        const keys = Object.keys((item as AnyBecauseTodo)[operator]);
        if (keys.length !== 1) {
          throw new Error(`Invalid upsert operator data: ${operator}: ${item}`);
        }
        (usedOperators as AnyBecauseTodo)[keys[0]] = operator;
      }
    }

    let prefix = "(";
    for (const key in fields) {
      this.atoms.push(prefix);
      const operator = (usedOperators as AnyBecauseTodo)[key];
      if (operator) {
        let value = (item as AnyBecauseTodo)[operator][key];
        if (operator === "$push") {
          value = [value];
        }
        this.atoms.push(this.createArg(value ?? null, fields[key]));
      } else {
        if (key === "_id" && !item[key]) {
          item[key] = randomId();
        } else if (key === "createdAt" && !(item as AnyBecauseTodo)[key]) {
          (item as AnyBecauseTodo)[key] = new Date();
        }
        const type = fields[key];
        const value = (item as AnyBecauseTodo)[key];
        this.atoms.push(this.createArg(value ?? null, type));
      }
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

    const values = Object.keys(data).flatMap((key) => {
      const compiled = this.compileUpsertValue(key, (data as AnyBecauseTodo)[key]);
      return compiled.length ? [",", ...compiled] : [];
    }).slice(1);
    result = result.concat(values);

    return result;
  }

  private compileUpsertValue(key: string, value: any): Atom<T>[] {
    if (key === "_id") {
      return [];
    }
    if (key[0] === "$") {
      return this.compileUpsertOperator(key, value);
    }
    return [`"${key}" =`, this.createArg(value)];
  }

  private compileUpsertOperator(key: string, value: any): Atom<T>[] {
    const op = (UPSERT_OPERATORS as AnyBecauseTodo)[key];
    if (!op) {
      throw new Error(`Unknown upsert operator: ${key}: ${value}`);
    }
    const fields = Object.keys(value);
    if (fields.length !== 1) {
      throw new Error(`Too many keys in ${key} upsert: ${value}`);
    }
    const tableName = this.resolveTableName();
    const fieldName = this.resolveFieldName(fields[0]);
    const arg = this.createArg(value[fields[0]]);
    return [fieldName, `= ${op}(`, tableName, fieldName, ",", arg, ")"];
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
