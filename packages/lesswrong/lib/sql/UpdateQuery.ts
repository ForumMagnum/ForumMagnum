import Query, { Atom } from "./Query";
import Table from "./Table";
import SelectQuery from "./SelectQuery";

export type UpdateOptions = Partial<{
  limit: number,
  returnUpdated: boolean,
}>

/**
 * Builds a Postgres query to update some specific data in the given table.
 * Note that upserting is handled by `InsertQuery` instead.
 */
class UpdateQuery<T extends DbObject> extends Query<T> {
  constructor(
    table: Table,
    selector: string | MongoSelector<T>,
    modifier: MongoModifier<T>,
    options?: MongoUpdateOptions<T>, // TODO: What can options be?
    updateOptions?: UpdateOptions,
  ) {
    if (options?.upsert) {
      throw new Error("To create an upserting update use an InsertQuery with conflictStrategy 'upsert'");
    }

    super(table, ["UPDATE", table, "SET"]);
    this.nameSubqueries = false;

    const set: Partial<Record<keyof T, any>> = modifier.$set ?? {};
    const push: Partial<Record<keyof T, any>> = modifier.$push ?? {};
    for (const operation of Object.keys(modifier)) {
      switch (operation) {
        case "$set":
          break;
        case "$unset":
          for (const field of Object.keys(modifier.$unset)) {
            set[field] = null;
          }
          break;
        case "$inc":
          for (const field of Object.keys(modifier.$inc)) {
            set[field] = {$add: [`$${field}`, 1]};
          }
          break;
        case "$push":
          break;
        default:
          throw new Error(`Unimplemented update operation: ${operation}`);
      }
    }

    const compiledUpdates = [
      ...this.compileSetFields(set),
      ...this.compilePushFields(push),
    ];

    this.atoms = this.atoms.concat(compiledUpdates.slice(1));

    if (typeof selector === "string") {
      selector = {_id: selector};
    }

    const {limit, returnUpdated} = updateOptions ?? {};

    if (selector && Object.keys(selector).length > 0) {
      this.atoms.push("WHERE");

      if (limit) {
        this.atoms = this.atoms.concat([
          "_id IN",
          new SelectQuery(table, selector, {limit, projection: {_id: 1}}, {forUpdate: true}),
        ]);
      } else {
        this.appendSelector(selector);
      }
    } else if (limit) {
      this.atoms = this.atoms.concat([
        "WHERE _id IN ( SELECT \"_id\" FROM",
        table,
        "LIMIT",
        this.createArg(limit),
        "FOR UPDATE)",
      ]);
    }

    if (returnUpdated) {
      this.atoms.push("RETURNING *");
    }
  }

  private compileSetFields(sets: Partial<Record<keyof T, any>>): Atom<T>[] {
    const format = (resolvedField: string, updateValue: Atom<T>[]): Atom<T>[] =>
      [",", resolvedField, "=", ...updateValue];
    return this.compileUpdateFields(sets, format);
  }

  private compilePushFields(pushes: Partial<Record<keyof T, any>>): Atom<T>[] {
    const format = (resolvedField: string, updateValue: Atom<T>[]): Atom<T>[] =>
      [",", resolvedField, "= ARRAY_APPEND(", resolvedField, ",",  ...updateValue, ")"];
    return this.compileUpdateFields(pushes, format);
  }

  private compileUpdateFields(
    updates: Partial<Record<keyof T, any>>,
    format: (resolvedField: string, updateValue: Atom<T>[]) => Atom<T>[],
  ): Atom<T>[] {
    return Object.keys(updates).flatMap((field) => this.compileUpdateField(field, updates[field], format));
  }

  private compileUpdateField(
    field: string,
    value: any,
    format: (resolvedField: string, updateValue: Atom<T>[]) => Atom<T>[],
  ): Atom<T>[] {
    try {
      const resolvedField = this.resolveFieldName(field);
      const updateValue = typeof value === "object" && value && Object.keys(value).some((key) => key[0] === "$")
        ? this.compileExpression(value)
        : [this.createArg(value)];
      return format(resolvedField, updateValue);
    } catch {
      // eslint-disable-next-line no-console
      console.warn(`Field "${field}" is not recognized - is it missing from the schema?`);
      return [];
    }
  }
}

export default UpdateQuery;
