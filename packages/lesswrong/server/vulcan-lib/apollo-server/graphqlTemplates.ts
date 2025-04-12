import type { SchemaGraphQLFieldDescription, SchemaGraphQLFieldArgument } from './initGraphQL';

// version that does not make any fields required
const fieldTemplate = ({ name, type, args, directive, description, required }: SchemaGraphQLFieldDescription, indentation = '') =>
  `${description ?  `${indentation}# ${description}\n` : ''}${indentation}${name}${getArguments(args)}: ${type} ${directive ? directive : ''}`;

const convertToGraphQL = (fields: SchemaGraphQLFieldDescription[], indentation: string) => {
  return fields.length > 0 ? fields.map(f => fieldTemplate(f, indentation)).join('\n') : '';
};

const arrayToGraphQL = (fields: SchemaGraphQLFieldArgument[]) => fields.map(f => `${f.name}: ${f.type}`).join(', ');

/*

For backwards-compatibility reasons, args can either be a string or an array of objects

*/
const getArguments = (args: string|SchemaGraphQLFieldArgument[]|null|undefined) => {
  if (Array.isArray(args) && args.length > 0) {
    return `(${arrayToGraphQL(args)})`;
  } else if (typeof args === 'string') {
    return `(${args})`;
  } else {
    return '';
  }
};

// get GraphQL type for a given schema and field name
const getGraphQLType = <N extends CollectionNameString>(
  graphql: GraphQLFieldSpecification<N>,
  isInput = false,
) => {
  if (isInput && 'inputType' in graphql && graphql.inputType) {
    return graphql.inputType;
  }

  return graphql.outputType;
};

export function isGraphQLField(field: [string, GraphQLFieldSpecification<CollectionNameString> | undefined]): field is [string, GraphQLFieldSpecification<CollectionNameString>] {
  const [_, graphql] = field;
  if (!graphql) return false;

  return !!graphql.canRead?.length || !!graphql.canCreate?.length || !!graphql.canUpdate?.length || !!graphql.forceIncludeInExecutableSchema;
}

export function getAllGraphQLFields(schema: SchemaType<CollectionNameString>, padding = '    ') {
  return `{\n${getAllGraphQLFieldsWithoutBraces(schema, padding)}\n}`;
}

export function getAllGraphQLFieldsWithoutBraces(schema: SchemaType<CollectionNameString>, padding = '    ') {
  const fieldDescriptions = Object.entries(schema)
    .map(([fieldName, fieldSpec]) => [fieldName, fieldSpec.graphql] as const)
    .filter(isGraphQLField)
    .map(([fieldName, fieldGraphql]) => {
      const fieldType = getGraphQLType(fieldGraphql);

      return {
        description: '',
        name: fieldName,
        type: fieldType,
        args: fieldGraphql.arguments ?? [],
      };
    });

  if (fieldDescriptions.length === 0) {
    throw new Error('No graphql fields found');
  }

  return convertToGraphQL(fieldDescriptions, padding);
}

export function getCreatableGraphQLFields(schema: SchemaType<CollectionNameString>, padding = '    ') {
  return `{\n${getCreatableGraphQLFieldsWithoutBraces(schema, padding)}\n}`;
}

export function getCreatableGraphQLFieldsWithoutBraces(schema: SchemaType<CollectionNameString>, padding = '    ') {
  const fieldDescriptions = Object.entries(schema)
    .map(([fieldName, fieldSpec]) => [fieldName, fieldSpec.graphql] as const)
    .filter((field): field is [string, GraphQLFieldSpecification<CollectionNameString>] => !!field[1]?.canCreate?.length)
    .map(([fieldName, fieldGraphql]) => {
      const inputFieldType = getGraphQLType(fieldGraphql, true);
      const createFieldType = inputFieldType === 'Revision'
        ? 'JSON'
        : inputFieldType;

      return {
        name: fieldName,
        type: createFieldType,
      };
    });

  if (fieldDescriptions.length === 0) {
    throw new Error('No creatable fields found');
  }
  return convertToGraphQL(fieldDescriptions, padding);
}

export function getUpdatableGraphQLFields(schema: SchemaType<CollectionNameString>, padding = '    ') {
  return `{\n${getUpdatableGraphQLFieldsWithoutBraces(schema, padding)}\n}`;
}

export function getUpdatableGraphQLFieldsWithoutBraces(schema: SchemaType<CollectionNameString>, padding = '    ') {
  const fieldDescriptions = Object.entries(schema)
    .map(([fieldName, fieldSpec]) => [fieldName, fieldSpec.graphql] as const)
    .filter((field): field is [string, GraphQLFieldSpecification<CollectionNameString>] => !!field[1]?.canUpdate?.length)
    .map(([fieldName, fieldGraphql]) => {
      const inputFieldType = getGraphQLType(fieldGraphql, true);
      const createFieldType = inputFieldType === 'Revision'
        ? 'JSON'
        : inputFieldType;

      // Fields should not be required for updates
      const updateFieldType = (typeof createFieldType === 'string' && createFieldType.endsWith('!'))
        ? createFieldType.slice(0, -1)
        : createFieldType;

      return {
        name: fieldName,
        type: updateFieldType,
      };
    });

  if (fieldDescriptions.length === 0) {
    throw new Error('No updatable fields found');
  }
  return convertToGraphQL(fieldDescriptions, padding);
}
