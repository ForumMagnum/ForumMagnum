import { Type, IdType } from "./Type";
import { expectedIndexes } from "../collectionUtils";

class Table {
  private rawName: string;
  private name: string;
  private fields: Record<string, Type> = {};
  private indexes: string[][] = [];

  constructor(name: string) {
    this.rawName = name;
    this.name = `"${name}"`;
  }

  addField(name: string, type: Type) {
    this.fields[name] = type;
  }

  addIndex(index: string[]) {
    this.indexes.push(index);
  }

  getName() {
    return this.name;
  }

  toCreateSQL() {
    let result = `CREATE TABLE IF NOT EXISTS ${this.getName()} (\n`;
    result += `  id ${this.fields["id"].toString()} PRIMARY KEY`;
    for (const field of Object.keys(this.fields).filter((field) => field !== "id")) {
      result += `,\n  "${field}" ${this.fields[field].toString()}`;
    }
    return result + "\n);";
  }

  toCreateIndexSQL() {
    return this.indexes.map((index) => {
      const name = `idx_${this.rawName}_${index.join("_")}`;
      const fields = index.join(", ");
      return `CREATE INDEX IF NOT EXISTS ${name} ON ${this.name} USING btree(${fields})`;
    });
  }

  static fromCollection<T extends DbObject>(collection: CollectionBase<T>) {
    const table = new Table(collection.collectionName);

    const schema = collection._schemaFields;
    for (const field of Object.keys(schema)) {
      if (field === "_id") {
        table.addField("id", new IdType(collection));
      } else if (field.indexOf("$") < 0) {
        const fieldSchema = schema[field];
        if (!fieldSchema.resolveAs) {
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
