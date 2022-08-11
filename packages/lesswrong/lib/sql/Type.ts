import { getCollection } from "../vulcan-lib";
import GraphQLJSON from 'graphql-type-json';
import SimpleSchema from "simpl-schema";

export const isResolverOnly = <T extends DbObject>(schema: CollectionFieldSpecification<T>) =>
  schema.resolveAs && !schema.resolveAs.addOriginalField;

export abstract class Type {
  abstract toString() : string;

  static fromSchema<T extends DbObject>(
    schema: CollectionFieldSpecification<T>,
    indexSchema?: CollectionFieldSpecification<T>,
  ) {
    if (isResolverOnly(schema)) {
      throw new Error("Can't generate type for resolver-only field");
    }

    if (schema.defaultValue !== undefined) {
      const {defaultValue, ...rest} = schema;
      return new DefaultValueType(Type.fromSchema(rest, indexSchema), defaultValue);
    }

    if (!schema.optional) {
      return new NotNullType(Type.fromSchema({...schema, optional: true}, indexSchema));
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
        return new ArrayType(Type.fromSchema(indexSchema));
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
    return "INT";
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
  constructor(private subtype: Type) {
    super();
  }

  toString() {
    return `${this.subtype.toString()}[]`;
  }
}

export class IdType extends StringType {
  constructor(private collection: CollectionBase<any>) {
    super(27);
  }
}

export class NotNullType extends Type {
  constructor(private subtype: Type) {
    super();
  }

  toString() {
    return `${this.subtype.toString()} NOT NULL`;
  }
}

export class DefaultValueType extends Type {
  constructor(private subtype: Type, private value: any) {
    super();
  }

  toString() {
    return `${this.subtype.toString()} DEFAULT ${this.value}`;
  }
}
