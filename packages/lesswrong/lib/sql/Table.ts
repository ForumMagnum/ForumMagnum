import { Type, IdType, isResolverOnly } from "./Type";
import { expectedIndexes } from "../collectionUtils";

class Table {
  private fields: Record<string, Type> = {};
  private indexes: string[][] = [];

  constructor(private name: string) {}

  addField(name: string, type: Type) {
    this.fields[name] = type;
  }

  addIndex(index: string[]) {
    this.indexes.push(index);
  }

  hasIndex(index: string[]) {
    for (const ind of this.indexes) {
      if (index.length !== ind.length) {
        continue;
      }
      for (let i = 0; i < ind.length; ++i) {
        if (index[i] !== ind[i]) {
          break;
        }
      }
    }
    return false;
  }

  toCreateSQL(sql: SqlClient) {
    let query = `CREATE TABLE IF NOT EXISTS "${this.name}" (\n`;
    query += `  id ${this.fields["id"].toString()} PRIMARY KEY`;
    for (const field of Object.keys(this.fields).filter((field) => field !== "id")) {
      query += `,\n  "${field}" ${this.fields[field].toString()}`;
    }
    query += "\n);";
    return sql.unsafe(query);
  }

  buildCreateIndexSQL(sql: SqlClient, index: string[]) {
    const name = `"idx_${this.name}_${index.join("_")}"`;
    const fields = index.map((field) => `"${field}"`).join(", ");
    const query = `CREATE INDEX IF NOT EXISTS ${name} ON "${this.name}" USING btree(${fields})`;
    return sql.unsafe(query);
  }

  toCreateIndexSQL(sql: SqlClient) {
    return this.indexes.map((index) => this.buildCreateIndexSQL(sql, index));
  }

  toInsertSQL<T extends {}>(sql: SqlClient, data: T, ignoreConflicts = false) {
    const inserter = {};
    for (const field in this.fields) {
      inserter[field] = data[field] ?? null;
    }
    inserter["id"] = data["_id"];
    return sql`INSERT INTO ${sql(this.name)} ${sql(inserter)}
      ${ignoreConflicts ? sql`ON CONFLICT DO NOTHING` : sql``}`;
  }

  static fromCollection<T extends DbObject>(collection: CollectionBase<T>) {
    const table = new Table(collection.collectionName);

    const schema = collection._schemaFields;
    for (const field of Object.keys(schema)) {
      if (field === "_id") {
        table.addField("id", new IdType(collection));
      } else if (field.indexOf("$") < 0) {
        const fieldSchema = schema[field];
        if (!isResolverOnly(fieldSchema)) {
          const indexSchema = schema[`${field}.$`];
          table.addField(field, Type.fromSchema(fieldSchema, indexSchema));
        }
      }
    }

    const indexes = expectedIndexes[collection.collectionName] ?? [];
    for (const index of indexes) {
      table.addIndex(Object.keys(index.key));
    }

    return table;
  }
}

export default Table;
