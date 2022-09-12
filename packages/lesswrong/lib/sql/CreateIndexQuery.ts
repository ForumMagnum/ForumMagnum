import Query, { Atom } from "./Query";
import Table from "./Table";
import TableIndex from "./TableIndex";

/**
 * The general approach for now is to default to btree indexes, but to switch to gin if
 * any of the fields requires searching inside some JSON. This probably still isn't
 * totally optimal and the logic may need to be more complex. Also, we might just need
 * to create both indexes? There's a good explanation of the situation at
 * https://scalegrid.io/blog/using-jsonb-in-postgresql-how-to-effectively-store-index-json-data-in-postgresql/
 * We've enabled the 'btree_gin' extension so we can use field types in gin indexes that
 * ordinarily wouldn't be allowed.
 */
class CreateIndexQuery<T extends DbObject> extends Query<T> {
  constructor(table: Table, index: TableIndex, ifNotExists = true) {
    super(table, [
      `CREATE INDEX${ifNotExists ? " IF NOT EXISTS" : ""}`,
      `"${index.getName()}"`,
      "ON",
      table,
      "USING",
    ]);
    const {useGin, fields} = this.getFieldList(index);
    this.atoms = this.atoms.concat([useGin ? "gin (" : "btree (", ...fields, ")"]);
  }

  private getFieldList(index: TableIndex): {useGin: boolean, fields: Atom<T>[]} {
    const fields = index.getFields().map((field) => this.fieldNameToIndexField(field));
    const useGin = fields.some(({useGin}) => useGin);
    return {
      useGin,
      fields: fields.flatMap(({field}) => [",", field]).slice(1),
    };
  }

  private fieldNameToIndexField(fieldName: string) {
    const tokens = fieldName.split(".");
    return {
      useGin: tokens.length > 1,
      field: `"${tokens[0]}"`,
    };
  }
}

export default CreateIndexQuery;
