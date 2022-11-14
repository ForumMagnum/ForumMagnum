import Query, { Atom } from "./Query";
import Table from "./Table";
import TableIndex from "./TableIndex";

/**
 * Builds a Postgres query to create a new index on the given table.
 *
 * The general approach for now is to default to btree indexes, but to switch to gin if
 * any of the fields requires searching inside some JSON. This probably still isn't
 * totally optimal and the logic may need to be more complex. Also, we might just need
 * to create both indexes? There's a good explanation of the situation at
 * https://scalegrid.io/blog/using-jsonb-in-postgresql-how-to-effectively-store-index-json-data-in-postgresql/
 * We've enabled the 'btree_gin' extension so we can use field types in gin indexes that
 * ordinarily wouldn't be allowed.
 *
 * If the index already exists, setting `ifNotExists` to true will prevent an error from being thrown.
 */
class CreateIndexQuery<T extends DbObject> extends Query<T> {
  private isUnique: boolean;

  constructor(table: Table, index: TableIndex, ifNotExists = true) {
    super(table, [
      `CREATE ${index.isUnique() ? "UNIQUE " : ""}INDEX${ifNotExists ? " IF NOT EXISTS" : ""}`,
      `"${index.getName()}"`,
      "ON",
      table,
      "USING",
    ]);

    this.isIndex = true;
    this.isUnique = index.isUnique();
    const {useGin, fields} = this.getFieldList(index);
    this.atoms = this.atoms.concat([useGin ? "gin (" : "btree (", ...fields, ")"]);

    const filter = index.getPartialFilterExpression();
    if (filter) {
      this.atoms.push("WHERE");
      this.atoms = this.atoms.concat(this.compileSelector(filter));
    }
  }

  private getFieldList(index: TableIndex): {useGin: boolean, fields: Atom<T>[]} {
    const fields = index.getFields().map((field) => this.fieldNameToIndexField(field));
    const useGin = fields.some(({useGin}) => useGin);
    return {
      useGin,
      fields: fields.flatMap(({field}) => [",", field]).slice(1),
    };
  }

  /**
   * In mongo, indexes consider nulls to be distinct so trying to, for instance, insert
   * a duplicate null during an upsert will trigger an update instead of an insert.
   * Postgres on the other hand considers nulls to not be distinct, so in the example
   * above we'd get an insert instead of an update. This is fixed in Postgres 15 where
   * you can create a constraint with 'UNIQUE NULLS NOT DISTINCT', but PG 15 is still in
   * beta (it would also be an awkward special case for us to use a constraint for this
   * instead of an index). A simple workaround is to simply coalesce where needed.
   */
  private fieldNameToIndexField(fieldName: string) {
    const type = this.table.getField(fieldName);
    const coalesceValue = type?.getIndexCoalesceValue();
    const tokens = fieldName.split(".");
    const name = `"${tokens[0]}"`;
    return {
      useGin: tokens.length > 1,
      field: coalesceValue && this.isUnique ? `COALESCE(${name}, ${coalesceValue})` : name,
    };
  }
}

export default CreateIndexQuery;
