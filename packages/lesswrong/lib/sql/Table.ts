import { Vulcan, getCollection } from "../vulcan-lib";
import { Type, IdType } from "./Type";

class Table {
  private name: string;
  private fields: Record<string, Type> = {};

  constructor(name: string) {
    this.name = `"${name}"`;
  }

  addField(name: string, type: Type) {
    this.fields[name] = type;
  }

  getName() {
    return this.name;
  }

  toCreateSQL() {
    let result = `CREATE TABLE IF NOT EXISTS ${this.getName()} (\n`;
    result += `  id ${this.fields["id"].toString()} PRIMARY KEY`;
    for (const field of Object.keys(this.fields).filter((field) => field !== "id")) {
      result += `,\n  ${field} ${this.fields[field].toString()}`;
    }
    return result + "\n);";
  }

  static fromCollectionName(collectionName: CollectionNameString) {
    const collection = getCollection(collectionName);
    if (!collection) {
      throw new Error(`Invalid collection: ${collectionName}`);
    }

    const table = new Table(collectionName);

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

    return table;
  }
}

Vulcan.collectionNameToTable = (name: CollectionNameString) => {
  const table = Table.fromCollectionName(name);
  console.log(table.toCreateSQL());
};
