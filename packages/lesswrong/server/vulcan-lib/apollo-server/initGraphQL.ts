// Generate GraphQL-syntax schemas from resolvers &c that were set up with
// addGraphQLResolvers &c.

import { makeExecutableSchema } from 'apollo-server';
import { getAdditionalSchemas, queries, mutations, getResolvers, QueryAndDescription, MutationAndDescription } from '../../../lib/vulcan-lib/graphql';
import {
  selectorInputTemplate,
  mainTypeTemplate,
  createInputTemplate,
  createDataInputTemplate,
  updateInputTemplate,
  updateDataInputTemplate,
  orderByInputTemplate,
  selectorUniqueInputTemplate,
  deleteInputTemplate,
  upsertInputTemplate,
  singleInputTemplate,
  multiInputTemplate,
  multiOutputTemplate,
  singleOutputTemplate,
  mutationOutputTemplate,
  singleQueryTemplate,
  multiQueryTemplate,
  createMutationTemplate,
  updateMutationTemplate,
  upsertMutationTemplate,
  deleteMutationTemplate,
} from './graphqlTemplates';
import type { GraphQLScalarType, GraphQLSchema } from 'graphql';
import { accessFilterMultiple, accessFilterSingle } from '../../../lib/utils/schemaUtils';
import { userCanReadField } from '../../../lib/vulcan-users/permissions';
import { getSchema } from '../../../lib/utils/getSchema';
import deepmerge from 'deepmerge';
import GraphQLJSON from 'graphql-type-json';
import GraphQLDate from './graphql-date';
import * as _ from 'underscore';
import { pluralize } from "../../../lib/vulcan-lib/pluralize";
import { camelCaseify, camelToSpaces } from "../../../lib/vulcan-lib/utils";
import { getAllCollections, getCollectionByTypeName } from "../../../lib/vulcan-lib/getCollection";

const queriesToGraphQL = (queries: QueryAndDescription[]): string =>
  `type Query {
${queries.map(q =>
        `${
          q.description
            ? `  # ${q.description}\n`
            : ''
        }  ${q.query}
  `
    )
    .join('\n')}
}

`;
const mutationsToGraphQL = (mutations: MutationAndDescription[]): string =>
  mutations.length > 0
    ? `
${
        mutations.length > 0
          ? `type Mutation {

${mutations
              .map(m => `${
                m.description
                  ? `  # ${m.description}\n`
                  : ''
              }  ${m.mutation}\n`)
              .join('\n')}
}
`
          : ''
      }

`
    : '';

// generate GraphQL schemas for all registered collections
const getTypeDefs = () => {
  const schemaContents: Array<string> = [
    "scalar JSON",
    "scalar Date",
    getAdditionalSchemas(),
  ];
  
  const allQueries = [...queries];
  const allMutations = [...mutations];
  const allResolvers: Array<any> = [];
  
  for (let collection of getAllCollections()) {
    const { schema, addedQueries, addedResolvers, addedMutations } = generateSchema(collection);

    for (let query of addedQueries) allQueries.push(query);
    for (let resolver of addedResolvers) allResolvers.push(resolver);
    for (let mutation of addedMutations) allMutations.push(mutation);
    
    schemaContents.push(schema);
  }
  
  schemaContents.push(queriesToGraphQL(allQueries));
  schemaContents.push(mutationsToGraphQL(allMutations));
  
  return {
    schemaText: schemaContents.join("\n"),
    addedResolvers: allResolvers,
  };
}

// get GraphQL type for a given schema and field name
const getGraphQLType = <N extends CollectionNameString>(
  schema: SchemaType<N>,
  fieldName: string,
  isInput = false,
): string|null => {
  const field = schema[fieldName];
  const type = field.type.singleType;
  const typeName =
    typeof type === 'object' ? 'Object' : typeof type === 'function' ? type.name : type;

  switch (typeName) {
    case 'String':
      return 'String';

    case 'Boolean':
      return 'Boolean';

    case 'Number':
      return 'Float';

    case 'SimpleSchema.Integer':
      return 'Int';

    // for arrays, look for type of associated schema field or default to [String]
    case 'Array':
      const arrayItemFieldName = `${fieldName}.$`;
      // note: make sure field has an associated array
      if (schema[arrayItemFieldName]) {
        // try to get array type from associated array
        const arrayItemType = getGraphQLType(schema, arrayItemFieldName);
        return arrayItemType ? `[${arrayItemType}]` : null;
      }
      return null;

    case 'Object':
      return 'JSON';

    case 'Date':
      return 'Date';

    default:
      return null;
  }
};

/**
 * Get the data needed to apply an access filter based on a graphql resolver
 * return type.
 */
const getSqlResolverPermissionsData = (type: string|GraphQLScalarType) => {
  // We only have access filters for return types that correspond to a collection.
  if (typeof type !== "string") {
    return null;
  }

  // We need to use a multi access filter for arrays, or a single access filter
  // otherwise. We only apply the automatic filter for single dimensional arrays.
  const isArray = type.indexOf("[") === 0 && type.lastIndexOf("[") === 0;

  // Remove all "!"s (denoting nullability) and any array brackets to leave behind
  // a type name string.
  const nullableScalarType = type.replace(/[![\]]+/g, "");

  try {
    // Get the collection corresponding to the type name string.
    const collection = getCollectionByTypeName(nullableScalarType);
    return collection ? {collection, isArray} : null;
  } catch (_e) {
    return null;
  }
}

export type SchemaGraphQLFieldArgument = {name: string, type: string|GraphQLScalarType|null}
export type SchemaGraphQLFieldDescription = {
  description?: string
  name: string
  args?: SchemaGraphQLFieldArgument[]|string|null|undefined
  type: string|GraphQLScalarType|null
  directive?: string
  required?: boolean
};

type SchemaGraphQLFields = {
  mainType: SchemaGraphQLFieldDescription[],
  create: SchemaGraphQLFieldDescription[],
  update: SchemaGraphQLFieldDescription[],
  selector: SchemaGraphQLFieldDescription[],
  selectorUnique: SchemaGraphQLFieldDescription[],
  orderBy: SchemaGraphQLFieldDescription[],
}

// for a given schema, return main type fields, selector fields,
// unique selector fields, orderBy fields, creatable fields, and updatable fields
const getFields = <N extends CollectionNameString>(schema: SchemaType<N>, typeName: string): {
  fields: SchemaGraphQLFields
  resolvers: any
}=> {
  const fields: SchemaGraphQLFields = {
    mainType: [],
    create: [],
    update: [],
    selector: [],
    selectorUnique: [],
    orderBy: [],
  };
  const addedResolvers: Array<any> = [];

  Object.keys(schema).forEach(fieldName => {
    const field = schema[fieldName];
    const fieldType = getGraphQLType(schema, fieldName);
    const inputFieldType = getGraphQLType(schema, fieldName, true);

    // only include fields that are viewable/insertable/editable and don't contain "$" in their name
    // note: insertable/editable fields must be included in main schema in case they're returned by a mutation
    // OpenCRUD backwards compatibility
    if (
      (field.canRead || field.canCreate || field.canUpdate)
      && fieldName.indexOf('$') === -1
    ) {
      const fieldDescription = field.description;
      const fieldDirective = '';
      const fieldArguments: Array<any> = [];

      // if field has a resolveAs, push it to schema
      if (field.resolveAs) {
        // get resolver name from resolveAs object, or else default to field name
        const resolverName = field.resolveAs.fieldName || fieldName;

        // use specified GraphQL type or else convert schema type
        const fieldGraphQLType = field.resolveAs.type || fieldType;

        // if resolveAs is an object, first push its type definition
        // include arguments if there are any
        // note: resolved fields are not internationalized
        fields.mainType.push({
          description: field.resolveAs.description,
          name: resolverName,
          args: field.resolveAs.arguments,
          type: fieldGraphQLType,
        });

        const permissionData = getSqlResolverPermissionsData(field.resolveAs!.type);

        // then build actual resolver object and pass it to addGraphQLResolvers
        const resolver = {
          [typeName]: {
            [resolverName]: (document: ObjectsByCollectionName[N], args: any, context: ResolverContext) => {
              // Check that current user has permission to access the original
              // non-resolved field.
              if (!userCanReadField(context.currentUser, field, document)) {
                return null;
              }

              // First, check if the value was already fetched by a SQL resolver.
              // A field with a SQL resolver that returns no value (for instance,
              // if it uses a LEFT JOIN and no matching object is found) can be
              // distinguished from a field with no SQL resolver as the former
              // will be `null` and the latter will be `undefined`.
              if (field.resolveAs!.sqlResolver) {
                const typedName = resolverName as keyof ObjectsByCollectionName[N];
                let existingValue = document[typedName];
                if (existingValue !== undefined) {
                  const {sqlPostProcess} = field.resolveAs!;
                  if (sqlPostProcess) {
                    existingValue = sqlPostProcess(existingValue, document, context);
                  }
                  if (permissionData) {
                    const filter = permissionData.isArray
                      ? accessFilterMultiple
                      : accessFilterSingle;
                    return filter(
                      context.currentUser,
                      permissionData.collection,
                      existingValue as AnyBecauseHard,
                      context,
                    );
                  }
                  return existingValue;
                }
              }

              // If the value wasn't supplied by a SQL resolver then we need
              // to run the code resolver instead.
              return field.resolveAs!.resolver(document, args, context);
            },
          },
        };
        addedResolvers.push(resolver);

        // if addOriginalField option is enabled, also add original field to schema
        if (field.resolveAs.addOriginalField && fieldType) {
          fields.mainType.push({
            description: fieldDescription,
            name: fieldName,
            args: fieldArguments,
            type: fieldType,
            directive: fieldDirective,
          });
        }
      } else {
        // try to guess GraphQL type
        if (fieldType) {
          fields.mainType.push({
            description: fieldDescription,
            name: fieldName,
            args: fieldArguments,
            type: fieldType,
            directive: fieldDirective,
          });
        }
      }

      // OpenCRUD backwards compatibility
      if (field.canCreate) {
        fields.create.push({
          name: fieldName,
          type: inputFieldType,
          required: !field.optional,
        });
      }
      // OpenCRUD backwards compatibility
      if (field.canUpdate) {
        fields.update.push({
          name: fieldName,
          type: inputFieldType,
        });
      }
    }
  });
  return { fields, resolvers: addedResolvers };
};

// generate a GraphQL schema corresponding to a given collection
const generateSchema = (collection: CollectionBase<CollectionNameString>) => {
  let graphQLSchema = '';

  const schemaFragments: Array<string> = [];

  const collectionName = collection.collectionName;

  const typeName = collection.typeName
    ? collection.typeName
    : camelToSpaces(_.initial(collectionName).join('')); // default to posts -> Post

  const schema = getSchema(collection);

  const { fields, resolvers: fieldResolvers } = getFields(schema, typeName);

  const { interfaces = [], resolvers, mutations } = collection.options;

  const description = collection.options.description
    ? collection.options.description
    : `Type for ${collectionName}`;

  const { mainType, create, update, selector, selectorUnique, orderBy } = fields;

  let addedQueries: Array<any> = [];
  let addedResolvers: Array<any> = [...fieldResolvers];
  let addedMutations: Array<any> = [];

  if (mainType.length) {
    schemaFragments.push(
      mainTypeTemplate({ typeName, description, interfaces, fields: mainType })
    );
    schemaFragments.push(deleteInputTemplate({ typeName }));
    schemaFragments.push(singleInputTemplate({ typeName }));
    schemaFragments.push(multiInputTemplate({ typeName }));
    schemaFragments.push(singleOutputTemplate({ typeName }));
    schemaFragments.push(multiOutputTemplate({ typeName }));
    schemaFragments.push(mutationOutputTemplate({ typeName }));

    if (create.length) {
      schemaFragments.push(createInputTemplate({ typeName }));
      schemaFragments.push(createDataInputTemplate({ typeName, fields: create }));
    }

    if (update.length) {
      schemaFragments.push(updateInputTemplate({ typeName }));
      schemaFragments.push(upsertInputTemplate({ typeName }));
      schemaFragments.push(updateDataInputTemplate({ typeName, fields: update }));
    }

    schemaFragments.push( selectorInputTemplate({ typeName, fields: selector }));

    schemaFragments.push(selectorUniqueInputTemplate({ typeName, fields: selectorUnique }));

    schemaFragments.push(orderByInputTemplate({ typeName, fields: orderBy }));

    if (!_.isEmpty(resolvers)) {
      const queryResolvers: Partial<Record<string,any>> = {};

      // single
      if (resolvers.single) {
        addedQueries.push({query: singleQueryTemplate({ typeName }), description: resolvers.single.description});
        queryResolvers[camelCaseify(typeName)] = resolvers.single.resolver.bind(
          resolvers.single
        );
      }

      // multi
      if (resolvers.multi) {
        addedQueries.push({query: multiQueryTemplate({ typeName }), description: resolvers.multi.description});
        queryResolvers[
          camelCaseify(pluralize(typeName))
        ] = resolvers.multi.resolver.bind(resolvers.multi);
      }
      addedResolvers.push({ Query: { ...queryResolvers } });
    }

    if (mutations && !_.isEmpty(mutations)) {
      const mutationResolvers: Partial<Record<string,any>> = {};
      // create
      if (mutations.create) {
        // e.g. "createMovie(input: CreateMovieInput) : Movie"
        if (create.length === 0) {
          // eslint-disable-next-line no-console
          console.log(
            `// Warning: you defined a "create" mutation for collection ${collectionName}, but it doesn't have any mutable fields, so no corresponding mutation types can be generated. Remove the "create" mutation or define a "canCreate" property on a field to disable this warning`
          );
        } else {
          addedMutations.push({mutation: createMutationTemplate({ typeName }), description: mutations.create.description});
          mutationResolvers[`create${typeName}`] = mutations.create.mutation.bind(
            mutations.create
          );
        }
      }
      // update
      if (mutations.update) {
        // e.g. "updateMovie(input: UpdateMovieInput) : Movie"
        if (update.length === 0) {
          // eslint-disable-next-line no-console
          console.log(
            `// Warning: you defined an "update" mutation for collection ${collectionName}, but it doesn't have any mutable fields, so no corresponding mutation types can be generated. Remove the "update" mutation or define a "canUpdate" property on a field to disable this warning`
          );
        } else {
          addedMutations.push({mutation: updateMutationTemplate({ typeName }), description: mutations.update.description});
          mutationResolvers[`update${typeName}`] = mutations.update.mutation.bind(
            mutations.update
          );
        }
      }
      // upsert
      if (mutations.upsert) {
        // e.g. "upsertMovie(input: UpsertMovieInput) : Movie"
        if (update.length === 0) {
          // eslint-disable-next-line no-console
          console.log(
            `// Warning: you defined an "upsert" mutation for collection ${collectionName}, but it doesn't have any mutable fields, so no corresponding mutation types can be generated. Remove the "upsert" mutation or define a "canUpdate" property on a field to disable this warning`
          );
        } else {
          addedMutations.push({mutation: upsertMutationTemplate({ typeName }), description: mutations.upsert.description});
          mutationResolvers[`upsert${typeName}`] = mutations.upsert.mutation.bind(
            mutations.upsert
          );
        }
      }
      // delete
      if (mutations.delete) {
        // e.g. "deleteMovie(input: DeleteMovieInput) : Movie"
        addedMutations.push({mutation: deleteMutationTemplate({ typeName }), description: mutations.delete.description});
        mutationResolvers[`delete${typeName}`] = mutations.delete.mutation.bind(mutations.delete);
      }
      addedResolvers.push({ Mutation: { ...mutationResolvers } });
    }
    graphQLSchema = schemaFragments.join('\n\n') + '\n\n\n';
  } else {
    // eslint-disable-next-line no-console
    console.log(
      `Warning: collection ${collectionName} doesn't have any GraphQL-enabled fields, so no corresponding type can be generated.`
    );
  }

  return {
    schema: graphQLSchema,
    addedQueries,
    addedResolvers,
    addedMutations
  };
};



export const initGraphQL = () => {
  const { schemaText, addedResolvers } = getTypeDefs();
  
  let allResolvers = deepmerge(
    getResolvers(),
    {
      JSON: GraphQLJSON,
      Date: GraphQLDate,
    }
  );
  for (let addedResolverGroup of addedResolvers) {
    allResolvers = deepmerge(allResolvers, addedResolverGroup);
  }
  
  executableSchema = makeExecutableSchema({
    typeDefs: schemaText,
    resolvers: allResolvers,
  });

  return executableSchema;
};

let executableSchema: GraphQLSchema | null = null;
export const getExecutableSchema = () => {
  if (!executableSchema) {
    throw new Error('Warning: trying to access executable schema before it has been created by the server.');
  }
  return executableSchema;
};
