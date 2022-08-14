import { Type, IdType, isResolverOnly } from "./Type";
import { expectedIndexes } from "../collectionUtils";

class Table {
  private fields: Record<string, Type> = {};
  private indexes: string[][] = [];

  constructor(private name: string) {}

  getName() {
    return this.name;
  }

  addField(name: string, type: Type) {
    this.fields[name] = type;
  }

  getFields() {
    return this.fields;
  }

  getField(name: string) {
    return this.fields[name];
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
    query += `  _id ${this.fields["_id"].toString()} PRIMARY KEY`;
    for (const field of Object.keys(this.fields).filter((field) => field !== "_id")) {
      query += `,\n  "${field}" ${this.fields[field].toString()}`;
    }
    query += "\n);";
    return sql.unsafe(query);
  }

  buildCreateIndexSQL(sql: SqlClient, index: string[]) {
    index = index.map((field) => {
      const index = field.indexOf(".");
      return index >= 0 ? field.slice(0, index) : field;
    });
    const name = `"idx_${this.name}_${index.join("_")}"`;
    const fields = index.map((field) => `"${field}"`).join(", ");
    const query = `CREATE INDEX IF NOT EXISTS ${name} ON "${this.name}" USING btree(${fields})`;
    return sql.unsafe(query);
  }

  toCreateIndexSQL(sql: SqlClient) {
    return this.indexes.map((index) => this.buildCreateIndexSQL(sql, index));
  }

  static fromCollection<T extends DbObject>(collection: CollectionBase<T>) {
    const table = new Table(collection.collectionName);

    const schema = collection._schemaFields;
    for (const field of Object.keys(schema)) {
      if (field === "_id") {
        table.addField("_id", new IdType(collection));
      } else if (field.indexOf("$") < 0) {
        const fieldSchema = schema[field];
        if (!isResolverOnly(field, fieldSchema)) {
          const indexSchema = schema[`${field}.$`];
          table.addField(field, Type.fromSchema(field, fieldSchema, indexSchema));
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
