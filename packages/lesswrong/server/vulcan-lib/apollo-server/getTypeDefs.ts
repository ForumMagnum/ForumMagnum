import { getAllCollections } from '@/server/collections/allCollections';
import { getGraphQLType, getSqlResolverPermissionsData, resolvers, SchemaGraphQLFields, typeDefs, undefined } from './initGraphQL';
import deepmerge from 'deepmerge';
import GraphQLJSON from 'graphql-type-json';
import GraphQLDate from './graphql-date';
import gql from 'graphql-tag';
import { getSimpleSchema } from '@/lib/schema/allSchemas';
import { pluralize } from '@/lib/vulcan-lib/pluralize';
import { camelToSpaces, camelCaseify } from '@/lib/vulcan-lib/utils';
import * as _ from 'underscore';
import { mainTypeTemplate, deleteInputTemplate, singleInputTemplate, multiInputTemplate, singleOutputTemplate, multiOutputTemplate, mutationOutputTemplate, createInputTemplate, createDataInputTemplate, updateInputTemplate, upsertInputTemplate, updateDataInputTemplate, selectorInputTemplate, selectorUniqueInputTemplate, orderByInputTemplate, singleQueryTemplate, multiQueryTemplate, createMutationTemplate, updateMutationTemplate, upsertMutationTemplate, deleteMutationTemplate } from './graphqlTemplates';
import { accessFilterMultiple, accessFilterSingle } from '@/lib/utils/schemaUtils';
import { userCanReadField } from '@/lib/vulcan-users/permissions';

const mutationsToGraphQL = (mutations: {mutation: string, description?: string}[]): string =>
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

const queriesToGraphQL = (queries: {query: string, description?: string}[]): string =>
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
`

// generate GraphQL schemas for all registered collections
export const getTypeDefs = () => {
  const schemaContents: Array<string> = [
    "scalar JSON",
    "scalar Date",
  ];

  const allQueries = [];
  const allMutations = [];
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
};


export const getGraphQLSchema = () => {
  const { schemaText, addedResolvers } = getTypeDefs();
  
  let allResolvers = {
    JSON: GraphQLJSON,
    Date: GraphQLDate,
    ...resolvers
  };

  for (let addedResolverGroup of addedResolvers) {
    allResolvers = deepmerge(allResolvers, addedResolverGroup);
  }

  console.log(schemaText, typeDefs);

  return {
    typeDefs: gql`
      ${gql`${schemaText}`}
      ${typeDefs}
    `,
    resolvers: allResolvers,
  }
};// generate a GraphQL schema corresponding to a given collection

export const generateSchema = (collection: CollectionBase<CollectionNameString>) => {
  let graphQLSchema = '';

  const schemaFragments: Array<string> = [];

  const collectionName = collection.collectionName;

  const typeName = collection.typeName
    ? collection.typeName
    : camelToSpaces(_.initial(collectionName).join('')); // default to posts -> Post

  const schema = getSimpleSchema(collectionName)._schema;

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

    schemaFragments.push(selectorInputTemplate({ typeName, fields: selector }));

    schemaFragments.push(selectorUniqueInputTemplate({ typeName, fields: selectorUnique }));

    schemaFragments.push(orderByInputTemplate({ typeName, fields: orderBy }));

    if (!_.isEmpty(resolvers)) {
      const queryResolvers: Partial<Record<string, any>> = {};

      // single
      if (resolvers.single) {
        addedQueries.push({ query: singleQueryTemplate({ typeName }), description: resolvers.single.description });
        queryResolvers[camelCaseify(typeName)] = resolvers.single.resolver.bind(
          resolvers.single
        );
      }

      // multi
      if (resolvers.multi) {
        addedQueries.push({ query: multiQueryTemplate({ typeName }), description: resolvers.multi.description });
        queryResolvers[camelCaseify(pluralize(typeName))] = resolvers.multi.resolver.bind(resolvers.multi);
      }
      addedResolvers.push({ Query: { ...queryResolvers } });
    }

    if (mutations && !_.isEmpty(mutations)) {
      const mutationResolvers: Partial<Record<string, any>> = {};
      // create
      if (mutations.create) {
        // e.g. "createMovie(input: CreateMovieInput) : Movie"
        if (create.length === 0) {
          // eslint-disable-next-line no-console
          console.log(
            `// Warning: you defined a "create" mutation for collection ${collectionName}, but it doesn't have any mutable fields, so no corresponding mutation types can be generated. Remove the "create" mutation or define a "canCreate" property on a field to disable this warning`
          );
        } else {
          addedMutations.push({ mutation: createMutationTemplate({ typeName }), description: mutations.create.description });
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
          addedMutations.push({ mutation: updateMutationTemplate({ typeName }), description: mutations.update.description });
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
          addedMutations.push({ mutation: upsertMutationTemplate({ typeName }), description: mutations.upsert.description });
          mutationResolvers[`upsert${typeName}`] = mutations.upsert.mutation.bind(
            mutations.upsert
          );
        }
      }
      // delete
      if (mutations.delete) {
        // e.g. "deleteMovie(input: DeleteMovieInput) : Movie"
        addedMutations.push({ mutation: deleteMutationTemplate({ typeName }), description: mutations.delete.description });
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
    addedMutations,
    addedResolvers,
  };
};
// for a given schema, return main type fields, selector fields,
// unique selector fields, orderBy fields, creatable fields, and updatable fields

export const getFields = <N extends CollectionNameString>(schema: SchemaType<N>, typeName: string): {
  fields: SchemaGraphQLFields;
  resolvers: any;
} => {
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
    if ((field.canRead || field.canCreate || field.canUpdate)
      && fieldName.indexOf('$') === -1) {
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
                  const { sqlPostProcess } = field.resolveAs!;
                  if (sqlPostProcess) {
                    existingValue = sqlPostProcess(existingValue, document, context);
                  }
                  if (permissionData) {
                    const filter = permissionData.isArray
                      ? accessFilterMultiple
                      : accessFilterSingle;
                    return filter(
                      context.currentUser,
                      permissionData.collectionName,
                      existingValue as AnyBecauseHard,
                      context
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

