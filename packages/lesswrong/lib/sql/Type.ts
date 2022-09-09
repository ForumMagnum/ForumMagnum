import { getCollection } from "../vulcan-lib/getCollection";
import GraphQLJSON from 'graphql-type-json';
import SimpleSchema from "simpl-schema";

const forceNonResolverFields = ["contents"];

export const isResolverOnly =
  <T extends DbObject>(fieldName: string, schema: CollectionFieldSpecification<T>) =>
    schema.resolveAs && !schema.resolveAs.addOriginalField && forceNonResolverFields.indexOf(fieldName) < 0;

export abstract class Type {
  abstract toString() : string;

  toConcrete(): Type {
    return this;
  }

  static fromSchema<T extends DbObject>(
    fieldName: string,
    schema: CollectionFieldSpecification<T>,
    indexSchema?: CollectionFieldSpecification<T>,
  ) {
    if (isResolverOnly(fieldName, schema)) {
      throw new Error("Can't generate type for resolver-only field");
    }

    if (schema.defaultValue !== undefined && schema.defaultValue !== null) {
      const {defaultValue, ...rest} = schema;
      return new DefaultValueType(Type.fromSchema(fieldName, rest, indexSchema), defaultValue);
    }

    if (schema.optional === false || schema.nullable === false) {
      return new NotNullType(Type.fromSchema(fieldName, {...schema, optional: true}, indexSchema));
    }

    switch (schema.type) {
      case String:
        return typeof schema.foreignKey === "string"
          ? new IdType(getCollection(schema.foreignKey as CollectionNameString))
          : new StringType(typeof schema.max === "number" ? schema.max : undefined);
      case Boolean:
        return new BoolType();
      case Date:
        return new DateType();
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
        return new ArrayType(Type.fromSchema(fieldName + ".$", indexSchema));
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
    return "REAL";
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
  private subtype: Type;

  constructor(subtype: Type) {
    super();
    this.subtype = subtype.toConcrete();
  }

  toString() {
    return `${this.subtype.toString()}[]`;
  }
}

export class IdType extends StringType {
  constructor(private collection: CollectionBase<any>) {
    super(27);
  }

  getCollection() {
    return this.collection;
  }
}

export class NotNullType extends Type {
  constructor(private subtype: Type) {
    super();
  }

  toString() {
    return `${this.subtype.toString()} NOT NULL`;
  }

  toConcrete() {
    return this.subtype.toConcrete();
  }
}

const valueToString = (value: any, subtype?: Type): string => {
  if (Array.isArray(value) && value.length === 0) {
    return subtype ? `'{}'::${subtype.toString()}[]` : "'{}'";
  } else if (typeof value === "string") {
    return `'${value}'`;
  } else if (typeof value === "object" && value) {
    return `'{${Object.keys(value).map((key) => `"${key}": ${valueToString(value[key])}`).join(",")}}'`;
  }
  return `${value}`;
}

export class DefaultValueType extends Type {
  constructor(private subtype: Type, private value: any) {
    super();
  }

  toString() {
    return `${this.subtype.toString()} DEFAULT ${this.valueToString()}`;
  }

  private valueToString() {
    return valueToString(this.value, this.subtype);
  }

  toConcrete() {
    return this.subtype.toConcrete();
  }
}

export class UnknownType extends Type {
  constructor() {
    super();
  }

  toString(): never {
    throw new Error("Cannot convert unknown type to string");
  }
}
