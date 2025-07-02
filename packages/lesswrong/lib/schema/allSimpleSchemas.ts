import { makeExecutableSchema } from '@graphql-tools/schema';
import type { GraphQLSchema } from 'graphql';
import GraphQLJSON from 'graphql-type-json';
import SimpleSchema, { SchemaDefinition } from 'simpl-schema';
import { allSchemas } from './allSchemas';

function getBaseType(typeString: string, graphqlSchema: GraphQLSchema) {
  switch (typeString) {
    case 'String':
      return String;
    case 'Float':
      return Number;
    case 'Int':
      return SimpleSchema.Integer;
    case 'Boolean':
      return Boolean;
    case 'Date':
      return Date;
    default: {
      const type = graphqlSchema.getType(typeString);
      if (type?.astNode?.kind === 'EnumTypeDefinition') {
        return 'String';
      }
      return Object;
    }
  }
}

function stripRequired(typeString: string) {
  const required = typeString.endsWith('!');
  return {
    typeString: required ? typeString.slice(0, -1) : typeString,
    required,
  };
}

function stripArray(typeString: string) {
  const array = typeString.startsWith('[') && typeString.endsWith(']');
  return {
    typeString: array ? typeString.slice(1, -1) : typeString,
    array,
  };
}

function getSimpleSchemaType(fieldName: string, graphqlSpec: GraphQLFieldSpecification<CollectionNameString>, graphqlSchema: GraphQLSchema) {
  const { validation = {} } = graphqlSpec;
  const { simpleSchema, ...remainingSimpleSchemaValidationFields } = validation;
  if (simpleSchema) {
    if (Array.isArray(simpleSchema)) {
      const [innerSchema] = simpleSchema;
      return {
        [fieldName]: {
          type: Array,
          ...remainingSimpleSchemaValidationFields,
        },
        [`${fieldName}.$`]: {
          type: innerSchema,
          ...remainingSimpleSchemaValidationFields,
        },
      };
    }
    return {
      [fieldName]: {
        type: simpleSchema,
        ...remainingSimpleSchemaValidationFields,
      },
    };
  }

  const validatorType = 'inputType' in graphqlSpec ? graphqlSpec.inputType : graphqlSpec.outputType;
  if (!validatorType) {
    throw new Error(`No validator type found for ${fieldName}`);
  }

  if (typeof validatorType === 'object') {
    const isGraphQLJSON = validatorType === GraphQLJSON;
    return {
      [fieldName]: {
        type: isGraphQLJSON ? GraphQLJSON : Object,
        ...remainingSimpleSchemaValidationFields,
      },
    };
  }

  const { typeString: outerTypeStringWithoutRequired, required: outerRequired } = stripRequired(validatorType);
  const { typeString: typeStringWithoutArray, array } = stripArray(outerTypeStringWithoutRequired);
  const { typeString: innerTypeWithoutRequired, required: innerRequired } = stripRequired(typeStringWithoutArray);
  const typeString = array ? innerTypeWithoutRequired : outerTypeStringWithoutRequired;
  const baseType = getBaseType(typeString, graphqlSchema);

  if (array) {
    const outerType = {
      ...remainingSimpleSchemaValidationFields,
      optional: remainingSimpleSchemaValidationFields.optional || !outerRequired,
      type: Array,
    };

    const innerType = {
      ...remainingSimpleSchemaValidationFields,
      optional: remainingSimpleSchemaValidationFields.optional || !innerRequired,
      type: baseType,
    };

    return {
      [fieldName]: outerType,
      [`${fieldName}.$`]: innerType,
    };
  }

  return {
    [fieldName]: {
      ...remainingSimpleSchemaValidationFields,
      optional: remainingSimpleSchemaValidationFields.optional || !outerRequired,
      type: baseType,
    },
  };
}

function isPlausiblyFormField(field: CollectionFieldSpecification<CollectionNameString>) {
  return /*field.form ||*/ !!field.graphql?.canCreate?.length || !!field.graphql?.canUpdate?.length;
}

function getSchemaDefinition(schema: SchemaType<CollectionNameString>): Record<string, SchemaDefinition> {
  const { resolvers, typeDefs }: typeof import('@/server/vulcan-lib/apollo-server/initGraphQL') = require('@/server/vulcan-lib/apollo-server/initGraphQL');
  // We unfortunately need this while we still have SimpleSchema implemented, so that it doesn't barf on graphql enum types.
  const graphqlSchema = makeExecutableSchema({ typeDefs, resolvers });

  return Object.entries(schema).reduce((acc, [key, value]) => {
    if (!value.graphql) {
      return acc;
    }

    // type, optional, regEx, allowedValues, and blackbox are handled by getSimpleSchemaType
    const typeDefs = getSimpleSchemaType(key, value.graphql, graphqlSchema);

    // database field which is nontheless used for form generation
    const defaultValue = value.database?.defaultValue;

    // database field which is used for type codegen
    const nullable = value.database?.nullable;

    // api-layer fields which are used for form generation
    const canRead = value.graphql?.canRead;
    const canUpdate = value.graphql?.canUpdate;
    const canCreate = value.graphql?.canCreate;

    // We need to include a bunch of fields in the validation schema that technically aren't form fields for codegen purposes,
    // but we don't want them to cause validation errors when checking that inserts/updates are valid.
    // So we need to add an `optional` prop to the schema definition for them.
    const isNonWriteableField = !isPlausiblyFormField(value);
    const implicitOptionalProp = isNonWriteableField ? { optional: true } : {};

    const originalTypeDef = typeDefs[key];
    const indexTypeDef = typeDefs[`${key}.$`];

    const fieldSchemaDefinition: SchemaDefinition = {
      ...originalTypeDef,
      // ...value.form,
      ...implicitOptionalProp,
      // This needs to be included even if false because it's used for type codegen in a way that relies on the difference between undefined and false
      // (i.e. the implicit default value of `nullable` in the context of database type codegen is `true`)
      ...(nullable !== undefined ? { nullable } : {}),
      ...(defaultValue ? { defaultValue } : {}),
      ...(canRead ? { canRead } : {}),
      ...(canUpdate ? { canUpdate } : {}),
      ...(canCreate ? { canCreate } : {}),
    };

    acc[key] = fieldSchemaDefinition;
    if (indexTypeDef) {
      acc[`${key}.$`] = indexTypeDef;
    }
    return acc;
  }, {} as Record<string, SchemaDefinition>);
}
const allSimpleSchemas: Record<CollectionNameString, SimpleSchema> = new Proxy({} as Record<CollectionNameString, SimpleSchema>, {
  get<N extends CollectionNameString>(target: Partial<Record<CollectionNameString, SimpleSchema>>, collectionName: N) {
    if (!target[collectionName]) {
      if (!(collectionName in allSchemas)) {
        throw new Error(`Invalid collection name: ${collectionName}`);
      }

      const schemaDefinition = getSchemaDefinition(allSchemas[collectionName]);
      target[collectionName] = new SimpleSchema(schemaDefinition);
    }

    return target[collectionName];
  }
});

export function getSimpleSchema<N extends CollectionNameString>(collectionName: N): SimpleSchemaType<N> {
  const simpleSchema = allSimpleSchemas[collectionName] as SimpleSchemaType<N>;
  return simpleSchema;
}
