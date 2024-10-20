import Query, { Atom } from "./Query";
import Table from "./Table";
import TableIndex from "./TableIndex";
import { StringType } from "./Type";

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

  constructor({ table, index, ifNotExists = true, allowConcurrent = true }: { table: Table<T>; index: TableIndex<T>; ifNotExists?: boolean; allowConcurrent?: boolean; }) {
    super(table);
    this.isIndex = true;
    this.calculateIsUnique(index);
    const concurrently = index.createConcurrently()

    const {useGin, fields} = this.getFieldList(index);
    this.atoms = [
      `CREATE ${this.isUnique ? "UNIQUE " : ""}INDEX${concurrently && allowConcurrent ? " CONCURRENTLY" : ""}${ifNotExists ? " IF NOT EXISTS" : ""}`,
      `"${index.getName()}"`,
      "ON",
      table,
      "USING",
      useGin ? "gin (" : "btree (",
      ...fields,
      ")",
    ];

    const filter = index.getPartialFilterExpression();
    if (filter) {
      this.atoms.push("WHERE");
      this.atoms = this.atoms.concat(this.compileSelector(filter));
    }
  }

  private calculateIsUnique(index: TableIndex<T>) {
    const {useGin} = this.getFieldList(index);
    this.isUnique = index.isUnique() && !useGin;
  }

  private getFieldList(index: TableIndex<T>): {useGin: boolean, fields: Atom<T>[]} {
    const isCaseInsensitive = index.isCaseInsensitive();
    const fields = index.getFields().map((field) =>
      this.fieldNameToIndexField(field, isCaseInsensitive),
    );
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
  private fieldNameToIndexField(fieldName: string, isCaseInsensitive: boolean) {
    const type = this.table.getField(fieldName);
    const coalesceValue = type?.getIndexCoalesceValue();
    const tokens = fieldName.split(".");
    const name = this.getIndexFieldName(tokens);
    const field = coalesceValue && this.isUnique
      ? `COALESCE(${name}, ${coalesceValue})`
      : name;
    return {
      useGin: tokens.length > 1 || this.table.getField(fieldName)?.isArray(),
      field: isCaseInsensitive && type?.toConcrete() instanceof StringType
        ? `LOWER(${field})`
        : field,
    };
  }

  /**
   * Correctly format a column name for an index
   * For simple and array fields, we just need to quote the name (eg; "_id")
   * For deep JSON indexes we need to dereference the object (eg; "services"->'resume')
   */
  private getIndexFieldName(tokens: string[]): string {
    if (tokens.length < 1) {
      throw new Error(`Invalid index field tokens: ${JSON.stringify(tokens)}`);
    }
    return tokens.length === 1 || this.getField(tokens[0])?.isArray()
      ? `"${tokens[0]}"`
      : `("${tokens[0]}"${tokens.slice(1).map((field) => `->'${field}'`).join("")})`;
  }
}

export default CreateIndexQuery;
