import { Type, IdType, isResolverOnly } from "./Type";
import { expectedIndexes } from "../collectionUtils";
import TableIndex from "./TableIndex";

class Table {
  private fields: Record<string, Type> = {};
  private indexes: TableIndex[] = [];

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

  addIndex(fields: string[], options?: MongoEnsureIndexOptions) {
    const index = new TableIndex(this.name, fields, options);
    this.indexes.push(index);
    return index;
  }

  hasIndex(fields: string[], options?: MongoEnsureIndexOptions) {
    return this.indexes.some((index) => index.equals(fields, options));
  }

  getIndexes() {
    return this.indexes;
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
