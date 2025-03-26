import { ID_LENGTH } from "@/lib/random";
import { DeferredForumSelect } from "@/lib/forumTypeUtils";
import { ForumTypeString } from "@/lib/instanceSettings";
import { editableFieldIsNormalized } from "@/lib/editor/make_editable";
import GraphQLJSON from "graphql-type-json";
import SimpleSchema from "simpl-schema";

const forceNonResolverFields = [
  "contents",
  "moderationGuidelines",
  "customHighlight",
  "originalContents",
  "description",
  "subforumWelcomeText",
  "howOthersCanHelpMe",
  "howICanHelpOthers",
  "biography",
  "frontpageDescription",
  "frontpageDescriptionMobile",
  "postPageDescription",
];

export const isResolverOnly = <N extends CollectionNameString>(
  collectionName: N,
  fieldName: string,
  schema: CollectionFieldSpecification<N>,
) => {
  if (editableFieldIsNormalized(collectionName, fieldName)) {
    return true;
  }
  return schema.resolveAs && !schema.resolveAs.addOriginalField && forceNonResolverFields.indexOf(fieldName) < 0;
}

export function isArrayTypeString<T extends DatabaseBaseType>(typeString: T | `${T}[]`): typeString is `${T}[]` {
  return typeString.endsWith('[]');
}

export function isVarcharTypeString<T extends DatabaseBaseType>(typeString: T): typeString is T & `VARCHAR(${number})` {
  return typeString.startsWith('VARCHAR(');
}

function getBaseTypeInstance(type: DatabaseBaseType, foreignKey?: DatabaseFieldSpecification<CollectionNameString>['foreignKey']) {
  if (isVarcharTypeString(type)) {
    if (type === 'VARCHAR(27)' || typeof foreignKey === 'string') {
      return new IdType();
    }
    const maxLength = parseInt(type.split('(')[1].split(')')[0]);
    return new StringType(maxLength);
  }

  switch (type) {
    case 'TEXT':
      return new StringType();
    case 'BOOL':
      return new BoolType();
    case 'DOUBLE PRECISION':
      return new FloatType();
    case 'INTEGER':
      return new IntType();
    case 'JSONB':
      return new JsonType();
    case 'TIMESTAMPTZ':
      return new DateType();
    case 'VECTOR(1536)':
      return new VectorType(1536);
  }
}

/**
 * The `Type` classes model data types as they exist in Postgres.
 */
export abstract class Type {
  /**
   * Convert the Type to a Postgres type name
   */
  abstract toString(): string;

  /**
   * Returns the default value as a Postgres string
   */
  getDefaultValueString(): string | null {
    return null;
  }

  /**
   * Convert this Type to a "concrete" Type - that is, remove any metadata
   * like nullability or default values to leave a raw column type.
   */
  toConcrete(): Type {
    return this;
  }

  isArray(): this is ArrayType {
    return false;
  }

  /**
   * In order to emulate Mongo's upsert semantics, we sometimes have to
   * use coalesce inside indexes. See `CreateIndexQuery.fieldNameToIndexField`.
   */
  getIndexCoalesceValue(): string | null {
    return null;
  }

  static fromSchema<N extends CollectionNameString>(
    collectionName: N,
    fieldName: string,
    databaseSpec: DatabaseFieldSpecification<N> | undefined,
    graphqlSpec: GraphQLFieldSpecification<N> | undefined,
    forumType: ForumTypeString,
  ): Type {
    if (!databaseSpec) {
      throw new Error("Can't generate type for resolver-only field");
    }

    if (databaseSpec.defaultValue !== undefined && databaseSpec.defaultValue !== null) {
      const { defaultValue, ...rest } = databaseSpec;
      const value = defaultValue instanceof DeferredForumSelect
        ? defaultValue.get(forumType)
        : defaultValue;

      return new DefaultValueType(
        Type.fromSchema(collectionName, fieldName, rest, graphqlSpec, forumType),
        value,
      );
    }

    if (graphqlSpec?.validation?.optional === false || databaseSpec.nullable === false) {
      const newDatabaseSpec = { ...databaseSpec, nullable: true };
      let newGraphqlSpec: GraphQLFieldSpecification<N> | undefined;
      if (graphqlSpec?.validation?.optional === false) {
        const { validation: { optional, ...validationRest }, ...graphqlRest } = graphqlSpec;
        newGraphqlSpec = { ...graphqlRest, validation: { ...validationRest } } as GraphQLFieldSpecification<N>;
      }

      return new NotNullType(
        Type.fromSchema(collectionName, fieldName, newDatabaseSpec, newGraphqlSpec, forumType),
      );
    }


    if (isArrayTypeString(databaseSpec.type)) {
      const baseTypeString = databaseSpec.type.slice(0, -2) as DatabaseBaseType;
      const baseType = getBaseTypeInstance(baseTypeString, databaseSpec.foreignKey);
      return new ArrayType(baseType);
    }

    if (fieldName === 'createdAt') {
      return new DefaultValueType(new DateType(), "CURRENT_TIMESTAMP");
    }

    return getBaseTypeInstance(databaseSpec.type, databaseSpec.foreignKey);
  }

  static fromOldSchema<N extends CollectionNameString>(
    collectionName: N,
    fieldName: string,
    schema: CollectionFieldSpecification<N>,
    indexSchema: CollectionFieldSpecification<N> | undefined,
    forumType: ForumTypeString,
  ): Type {
    if (isResolverOnly(collectionName, fieldName, schema)) {
      throw new Error("Can't generate type for resolver-only field");
    }

    if (schema.defaultValue !== undefined && schema.defaultValue !== null) {
      const {defaultValue, ...rest} = schema;
      const value = defaultValue instanceof DeferredForumSelect
        ? defaultValue.get(forumType)
        : defaultValue;
      return new DefaultValueType(
        Type.fromOldSchema(collectionName, fieldName, rest, indexSchema, forumType),
        value,
      );
    }

    if (schema.optional === false || schema.nullable === false) {
      const newSchema = {...schema, optional: true, nullable: true};
      return new NotNullType(
        Type.fromOldSchema(collectionName, fieldName, newSchema, indexSchema, forumType),
      );
    }

    switch (schema.type) {
      case String:
        return typeof schema.foreignKey === "string"
          ? new IdType()
          : new StringType(typeof schema.max === "number" ? schema.max : undefined);
      case Boolean:
        return new BoolType();
      case Date:
        return fieldName === "createdAt"
          ? new DefaultValueType(new DateType(), "CURRENT_TIMESTAMP")
          : new DateType();
      case Number:
        return new FloatType();
      case "SimpleSchema.Integer":
        return new IntType();
      case Object: case GraphQLJSON:
        return new JsonType();
      case Array:
        if (!indexSchema) {
          throw new Error("No schema type provided for array member");
        }
        if (schema.vectorSize) {
          if (indexSchema.type !== Number) {
            throw new Error("Vector items must be of type `Number`");
          }
          return new VectorType(schema.vectorSize);
        }
        return new ArrayType(
          Type.fromOldSchema(collectionName, fieldName + ".$", indexSchema, undefined, forumType),
        );
    }

    if (schema.type instanceof SimpleSchema) {
      return new JsonType();
    }

    throw new Error(`Unrecognized schema: ${JSON.stringify(schema)}`);
  }
}

export class StringType extends Type {
  constructor(private maxLength?: number) {
    super();
  }

  toString() {
    return this.maxLength === undefined ? "TEXT" : `VARCHAR(${this.maxLength})`;
  }

  getIndexCoalesceValue(): string | null {
    return "''";
  }
}

export class BoolType extends Type {
  toString() {
    return "BOOL";
  }
}

export class IntType extends Type {
  toString() {
    return "INTEGER";
  }
}

export class FloatType extends Type {
  toString() {
    return "DOUBLE PRECISION";
  }
}

export class DateType extends Type {
  toString() {
    return "TIMESTAMPTZ";
  }
}

export class JsonType extends Type {
  toString() {
    return "JSONB";
  }
}

export class ArrayType extends Type {
  subtype: Type;

  constructor(subtype: Type) {
    super();
    this.subtype = subtype.toConcrete();
  }

  getDefaultValueString(): string | null {
    return this.subtype.getDefaultValueString();
  }

  toString() {
    return `${this.subtype.toString()}[]`;
  }

  isArray(): this is ArrayType {
    return true;
  }
}

export class VectorType extends Type {
  constructor(private size: number) {
    super();
  }

  toString() {
    return `VECTOR(${this.size})`;
  }
}

/**
 * IdType is a convinience type to automatically make sure Vulcan
 * ID fields are stored correctly and efficiently
 * By default, our IDs are 17 characters (ID_LENGTH), but some legacy
 * data in Mongo uses ObjectId types which can be longer, so we add
 * an extra 10 characters for safety. In the future, we may be able to
 * reduce this after cleaning up the data, but it's too dangerous to do
 * right now.
 */
export class IdType extends StringType {
  constructor() {
    super(ID_LENGTH + 10);
  }
}

/**
 * Annotate a type as being non-nullable. Subtype may or may not be concrete.
 */
export class NotNullType extends Type {
  constructor(private type: Type) {
    super();
  }

  toString() {
    return `${this.type.toString()} NOT NULL`;
  }

  getDefaultValueString(): string | null {
    return this.type.getDefaultValueString();
  }

  toConcrete() {
    return this.type.toConcrete();
  }

  isArray(): this is ArrayType {
    return this.type.isArray();
  }
}

/**
 * When we insert literal values into SQL strings we need to wrap them in single quotes, so we
 * need escape any single quotes that are already in the string, which is done by adding a second
 * single quote next to it. Note that this is only done when settings default values for new
 * fields - other queries simply use Postgres arguments to avoid SQL injection attacks.
 */
const sqlEscape = (data: string): string => data.replace(/'/g, "''");

const escapedValueToString = (value: any, subtype?: Type): string =>
  sqlEscape(valueToString(value, subtype, true));

const valueToString = (value: any, subtype?: Type, isNested = false): string => {
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  } else if (Array.isArray(value)) {
    const itemType = subtype instanceof ArrayType ? subtype.subtype : undefined;
    const toString = isNested ? valueToString : escapedValueToString;
    const items = value.map((item: any) => toString(item, itemType)).join(",");
    if (isNested) {
      return `{${items}}`;
    }
    const wrappedItems = `'{${items}}'`;
    return subtype ? `${wrappedItems}::${subtype.toString()}[]` : wrappedItems;
  } else if (typeof value === "string") {
    return value.toLowerCase() === "current_timestamp" ? "CURRENT_TIMESTAMP" : `'${value}'`;
  } else if (typeof value === "object" && value) {
    const result = JSON.stringify(value);
    return isNested ? result : `'${sqlEscape(result)}'::JSONB`;
  }
  return `${value}`;
}

/**
 * Interpolate SQL args into a compiled SQL string - you should _NEVER_ use
 * this unless you know exactly what you're doing and you have a good reason
 * as it's extremely dangerous with untrusted input.
 */
export const sqlInterpolateArgs = (sql: string, args: any[]) => {
  for (let i = args.length - 1; i >= 0; i--) {
    sql = sql.replace(new RegExp(`\\$${i + 1}`, "g"), valueToString(args[i]));
  }
  return sql;
}

/**
 * Annotate a type as having a default value. Subtype may or may not be concrete.
 */
export class DefaultValueType extends Type {
  constructor(private type: Type, private value: any) {
    super();
  }

  toString() {
    return `${this.type.toString()} DEFAULT ${this.getDefaultValueString()}`;
  }

  getDefaultValue(): AnyBecauseHard {
    return this.value
  }

  getDefaultValueString(): string | null {
    return valueToString(this.value, this.type.isArray() ? this.type.subtype : undefined);
  }

  toConcrete() {
    return this.type.toConcrete();
  }

  isArray(): this is ArrayType {
    return this.type.isArray();
  }

  isNotNull(): boolean {
    return this.type instanceof NotNullType;
  }
}

/**
 * An unknown type. This is used as an implementation detail inside the query builder
 * and should not be used externally. If you see UnknownType appear in an error message
 * then you've probably hit a serious query builder bug.
 */
export class UnknownType extends Type {
  constructor() {
    super();
  }

  toString(): never {
    throw new Error("Cannot convert unknown type to string");
  }
}
