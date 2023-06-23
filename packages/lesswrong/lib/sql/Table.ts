import { Type, IdType, isResolverOnly } from "./Type";
import TableIndex from "./TableIndex";
import { expectedIndexes } from "../collectionIndexUtils";
import { forumTypeSetting, ForumTypeString } from "../instanceSettings";

/**
 * Table represents the collection schema as it exists in Postgres,
 * rather than how it exists in Vulcan or GraphQL. That is, each field
 * knows it's Postgres datatype and some extra info like nullability and
 * default values (see Type.ts), but not extended metadata that is
 * superflous to Postgres such as access permissions or form configuration.
 *
 * Resolver-only fields are excluded - Table only contains fields that
 * actually exist in the database.
 *
 * Note that the data here is still generated using the collection schema
 * files, so it's possible for this to become out-of-date with what's
 * actually in the database if migrations are not done correctly.
 */
class Table<T extends DbObject> {
  private fields: Record<string, Type> = {};
  private indexes: TableIndex<T>[] = [];

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

  countFields() {
    return Object.keys(this.fields).length;
  }

  addIndex(key: MongoIndexKeyObj<T>, options?: MongoEnsureIndexOptions<T>) {
    const index = new TableIndex<T>(this.name, key, options);
    this.indexes.push(index);
    return index;
  }

  hasIndex(fields: string[], options?: MongoEnsureIndexOptions<T>) {
    return this.indexes.some((index) => index.equals(fields, options));
  }

  getIndex(fields: string[], options?: MongoEnsureIndexOptions<T>) {
    return this.indexes.find((index) => index.equals(fields, options));
  }

  getIndexes() {
    return this.indexes;
  }

  static fromCollection<T extends DbObject>(collection: CollectionBase<T>, forumType?: ForumTypeString): Table<T> {
    const table = new Table<T>(collection.collectionName);
    forumType ??= forumTypeSetting.get() ?? "EAForum";

    const schema = collection._schemaFields;
    for (const field of Object.keys(schema)) {
      // Force `_id` fields to use the IdType type, with an exception for `Sessions`
      // which uses longer custom ids.
      if (field === "_id" && collection.collectionName !== "Sessions") {
        table.addField("_id", new IdType(collection));
      } else if (field.indexOf("$") < 0) {
        const fieldSchema = schema[field];
        if (!isResolverOnly(field, fieldSchema)) {
          const indexSchema = schema[`${field}.$`];
          table.addField(field, Type.fromSchema(field, fieldSchema, indexSchema, forumType));
        }
      }
    }

    const indexes = expectedIndexes[collection.collectionName] ?? [];
    for (const index of indexes) {
      const {key, ...options} = index;
      table.addIndex(key, options);
    }

    return table;
  }
}

export default Table;
