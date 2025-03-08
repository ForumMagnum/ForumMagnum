import { getSchema } from "@/lib/schema/allSchemas";
import { Type, IdType, isResolverOnly } from "./Type";
import { forumTypeSetting, ForumTypeString } from "@/lib/instanceSettings";

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
  private resolverOnlyFields = new Set<string>();
  private writeAheadLogged = true;

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

  hasResolverOnlyField(name: string) {
    return this.resolverOnlyFields.has(name);
  }

  countFields() {
    return Object.keys(this.fields).length;
  }

  isWriteAheadLogged() {
    return this.writeAheadLogged;
  }

  static fromCollection<
    N extends CollectionNameString,
    T extends DbObject = ObjectsByCollectionName[N]
  >(
    collection: CollectionBase<N>,
    forumType?: ForumTypeString,
  ): Table<T> {
    const table = new Table<T>(collection.collectionName);
    forumType ??= forumTypeSetting.get() ?? "EAForum";

    table.writeAheadLogged = collection.options?.writeAheadLogged ?? true;

    const schema = getSchema(collection.collectionName);
    for (const field of Object.keys(schema)) {
      // Force `_id` fields to use the IdType type, with an exception for `Sessions`
      // which uses longer custom ids.
      if (field === "_id" && collection.collectionName !== "Sessions") {
        table.addField("_id", new IdType());
      } else if (field.indexOf("$") < 0) {
        const fieldSchema = schema[field];
        if (isResolverOnly(collection.collectionName, field, fieldSchema)) {
          table.resolverOnlyFields.add(field);
        } else {
          const indexSchema = schema[`${field}.$`];
          table.addField(
            field,
            Type.fromSchema(collection.collectionName, field, fieldSchema, indexSchema, forumType),
          );
        }
      }
    }

    return table;
  }
}

export default Table;
