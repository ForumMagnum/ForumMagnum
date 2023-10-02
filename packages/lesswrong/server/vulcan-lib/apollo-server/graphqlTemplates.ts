import { camelCaseify, pluralize } from '../../../lib/vulcan-lib';
import type { SchemaGraphQLFieldDescription, SchemaGraphQLFieldArgument } from './initGraphQL';

const convertToGraphQL = (fields: SchemaGraphQLFieldDescription[], indentation: string) => {
  return fields.length > 0 ? fields.map(f => fieldTemplate(f, indentation)).join('\n') : '';
};

export const arrayToGraphQL = (fields: SchemaGraphQLFieldArgument[]) => fields.map(f => `${f.name}: ${f.type}`).join(', ');

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

/* ------------------------------------- Generic Field Template ------------------------------------- */

// export const fieldTemplate = ({ name, type, args, directive, description, required }, indentation = '') =>
// `${description ?  `${indentation}# ${description}\n` : ''}${indentation}${name}${getArguments(args)}: ${type}${required ? '!' : ''} ${directive ? directive : ''}`;

// version that does not make any fields required
const fieldTemplate = ({ name, type, args, directive, description, required }: SchemaGraphQLFieldDescription, indentation = '') =>
`${description ?  `${indentation}# ${description}\n` : ''}${indentation}${name}${getArguments(args)}: ${type} ${directive ? directive : ''}`;

/* ------------------------------------- Main Type ------------------------------------- */

/*

The main type

type Movie{
  _id: String
  title: String
  description: String
  createdAt: Date
}

*/
export const mainTypeTemplate = ({ typeName, description, interfaces, fields }: {
  typeName: string,
  description?: string,
  interfaces: string[],
  fields: SchemaGraphQLFieldDescription[],
}) => (
  `# ${description}
  type ${typeName} ${interfaces.length ? `implements ${interfaces.join(', ')} ` : ''}{
  ${convertToGraphQL(fields, '  ')}
  }
`);

/* ------------------------------------- Selector Types ------------------------------------- */

/*

The selector type is used to query for one or more documents

type MovieSelectorInput {
  AND: [MovieSelectorInput]
  OR: [MovieSelectorInput]
  id: String
  id_not: String
  id_in: [String!]
  id_not_in: [String!]
  ...
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  ...
}

see https://www.opencrud.org/#sec-Data-types

*/
export const selectorInputTemplate = ({ typeName, fields }: { typeName: string, fields: SchemaGraphQLFieldDescription[] }) => (
`input ${typeName}SelectorInput {
  AND: [${typeName}SelectorInput]
  OR: [${typeName}SelectorInput]
${convertToGraphQL(fields, '  ')}
}`
);

/*

The unique selector type is used to query for exactly one document

type MovieSelectorUniqueInput {
  _id: String
  slug: String
}

*/
export const selectorUniqueInputTemplate = ({ typeName, fields }: { typeName: string, fields: SchemaGraphQLFieldDescription[] }) => (
`input ${typeName}SelectorUniqueInput {
  _id: String
  documentId: String # OpenCRUD backwards compatibility
  slug: String
${convertToGraphQL(fields, '  ')}
}`
);

/*

The orderBy type defines which fields a query can be ordered by

enum MovieOrderByInput {
  title
  createdAt
}

*/
export const orderByInputTemplate = ({ typeName, fields }: { typeName: string, fields: SchemaGraphQLFieldDescription[] }) => (
`enum ${typeName}OrderByInput {
  foobar
  ${fields.join('\n  ')}
}`
);

/* ------------------------------------- Query Types ------------------------------------- */

/*

A query for a single document

movie(input: SingleMovieInput) : SingleMovieOutput

*/
export const singleQueryTemplate = ({ typeName }: {typeName: string}) => `${camelCaseify(typeName)}(input: Single${typeName}Input): Single${typeName}Output`;


/*

A query for multiple documents

movies(input: MultiMovieInput) : MultiMovieOutput

*/
export const multiQueryTemplate = ({ typeName }: {typeName: string}) => `${camelCaseify(pluralize(typeName))}(input: Multi${typeName}Input): Multi${typeName}Output`;

/* ------------------------------------- Query Input Types ------------------------------------- */

/*

The argument type when querying for a single document

type SingleMovieInput {
  selector {
    documentId: String
    # or `_id: String`
    # or `slug: String`
  }
  enableCache: Boolean
}

*/
export const singleInputTemplate = ({ typeName }: {typeName: string}) => (
`input Single${typeName}Input {
  selector: ${typeName}SelectorUniqueInput
  # Whether to enable caching for this query
  enableCache: Boolean
  # Return null instead of throwing MissingDocumentError
  allowNull: Boolean
}`
);

/*

The argument type when querying for multiple documents

type MultiMovieInput {
  terms: JSON
  offset: Int
  limit: Int
  enableCache: Boolean
}

*/
export const multiInputTemplate = ({ typeName }: {typeName: string}) => (
`input Multi${typeName}Input {
  # A JSON object that contains the query terms used to fetch data
  terms: JSON,
  # How much to offset the results by
  offset: Int,
  # A limit for the query
  limit: Int,
  # Whether to enable caching for this query
  enableCache: Boolean
  # Whether to calculate totalCount for this query
  enableTotal: Boolean
  # The document to create if none are found
  createIfMissing: JSON
  # The name of the fragment used for the query
  fragmentName: String
  # OpenCRUD fields
  where: ${typeName}SelectorInput
  orderBy: ${typeName}OrderByInput
  skip: Int
  after: String
  before: String
  first: Int
  last: Int
}`
);

/* ------------------------------------- Query Output Types ------------------------------------- */

/*

The type for the return value when querying for a single document

type SingleMovieOuput{
  result: Movie
}

*/
export const singleOutputTemplate = ({ typeName }: {typeName: string}) => (
`type Single${typeName}Output{
  result: ${typeName}
}`
);

/*

The type for the return value when querying for multiple documents

type MultiMovieOuput{
  results: [Movie]
  totalCount: Int
}

*/
export const multiOutputTemplate = ({ typeName }: {typeName: string}) => (
`type Multi${typeName}Output{
  results: [${typeName}]
  totalCount: Int
}`
);

/* ------------------------------------- Mutation Types ------------------------------------- */

/*

Mutation for creating a new document

createMovie(input: CreateMovieInput) : MovieOutput

*/
export const createMutationTemplate = ({ typeName }: {typeName: string}) => (
  `create${typeName}(data: Create${typeName}DataInput!) : ${typeName}Output`
);

/*

Mutation for updating an existing document

updateMovie(input: UpdateMovieInput) : MovieOutput

*/
export const updateMutationTemplate = ({ typeName }: {typeName: string}) => (
  `update${typeName}(selector: ${typeName}SelectorUniqueInput!, data: Update${typeName}DataInput! ) : ${typeName}Output`
);

/*

Mutation for updating an existing document; or creating it if it doesn't exist yet

upsertMovie(input: UpsertMovieInput) : MovieOutput

*/
export const upsertMutationTemplate = ({ typeName }: {typeName: string}) => (
  `upsert${typeName}(selector: ${typeName}SelectorUniqueInput!, data: Update${typeName}DataInput! ) : ${typeName}Output`
);

/*

Mutation for deleting an existing document

deleteMovie(input: DeleteMovieInput) : MovieOutput

*/
export const deleteMutationTemplate = ({ typeName }: {typeName: string}) => (
  `delete${typeName}(selector: ${typeName}SelectorUniqueInput!) : ${typeName}Output`
);

/* ------------------------------------- Mutation Input Types ------------------------------------- */

// note: not currently used

/*

Type for create mutation input argument

type CreateMovieInput {
  data: CreateMovieDataInput!
}

*/
export const createInputTemplate = ({ typeName }: {typeName: string}) => (
`input Create${typeName}Input{
  data: Create${typeName}DataInput!
}`
);

/*

Type for update mutation input argument

type UpdateMovieInput {
  selector: MovieSelectorUniqueInput!
  data: UpdateMovieDataInput!
}

*/
export const updateInputTemplate = ({ typeName }: {typeName: string}) => (
`input Update${typeName}Input{
  selector: ${typeName}SelectorUniqueInput!
  data: Update${typeName}DataInput!
}`
);

/*

Type for upsert mutation input argument

Note: upsertInputTemplate uses same data type as updateInputTemplate

type UpsertMovieInput {
  selector: MovieSelectorUniqueInput!
  data: UpdateMovieDataInput!
}

*/
export const upsertInputTemplate = ({ typeName }: {typeName: string}) => (
`input Upsert${typeName}Input{
  selector: ${typeName}SelectorUniqueInput!
  data: Update${typeName}DataInput!
}`
);

/*

Type for delete mutation input argument

type DeleteMovieInput {
  selector: MovieSelectorUniqueInput!
}

*/
export const deleteInputTemplate = ({ typeName }: {typeName: string}) => (
`input Delete${typeName}Input{
  selector: ${typeName}SelectorUniqueInput!
}`
);

/*

Type for the create mutation input argument's data property

type CreateMovieDataInput {
  title: String
  description: String
}

*/
export const createDataInputTemplate = ({ typeName, fields }: { typeName: string, fields: SchemaGraphQLFieldDescription[] }) => (
`input Create${typeName}DataInput {
${convertToGraphQL(fields, '  ')}
}`
);

/*

Type for the update mutation input argument's data property

type UpdateMovieDataInput {
  title: String
  description: String
}

*/
export const updateDataInputTemplate = ({ typeName, fields }: { typeName: string, fields: SchemaGraphQLFieldDescription[] }) => (
`input Update${typeName}DataInput {
${convertToGraphQL(fields, '  ')}
}`
);

/* ------------------------------------- Mutation Output Type ------------------------------------- */

/*

Type for the return value of all mutations

type MovieOutput {
  data: Movie
}

*/
export const mutationOutputTemplate = ({ typeName }: {typeName: string}) => (
`type ${typeName}Output{
  data: ${typeName}
}`
);

/* ------------------------------------- Mutation Queries ------------------------------------- */

/*

Upsert mutation query used on the client

mutation upsertMovie($selector: MovieSelectorUniqueInput!, $data: UpdateMovieDataInput!) {
  upsertMovie(selector: $selector, data: $data) {
    data {
      _id
      name
      __typename
    }
    __typename
  }
}

*/
export const upsertClientTemplate = ({ typeName, fragmentName, extraVariablesString }: {
  typeName: string,
  fragmentName: string,
  extraVariablesString?: string,
}) => (
`mutation upsert${typeName}($selector: ${typeName}SelectorUniqueInput!, $data: Update${typeName}DataInput!, ${extraVariablesString || ''}) {
  upsert${typeName}(selector: $selector, data: $data) {
    data {
      ...${fragmentName}
    }
  }
}`
);
