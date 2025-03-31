// Generate GraphQL-syntax schemas from resolvers &c that were set up with
// addGraphQLResolvers &c.

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
import type { GraphQLScalarType } from 'graphql';
import { accessFilterMultiple, accessFilterSingle } from '../../../lib/utils/schemaUtils';
import { userCanReadField } from '../../../lib/vulcan-users/permissions';
import gql from 'graphql-tag'; 
import * as _ from 'underscore';
import { pluralize } from "../../../lib/vulcan-lib/pluralize";
import { camelCaseify, camelToSpaces } from "../../../lib/vulcan-lib/utils";
import { typeNameToCollectionName } from '@/lib/generated/collectionTypeNames';
import { graphqlTypeDefs as notificationTypeDefs, graphqlQueries as notificationQueries } from '@/server/notificationBatching';
import { graphqlTypeDefs as arbitalLinkedPagesTypeDefs } from '@/lib/collections/helpers/arbitalLinkedPagesField';
import { graphqlTypeDefs as additionalPostsTypeDefs } from '@/lib/collections/posts/newSchema';
import { graphqlTypeDefs as additionalRevisionsTypeDefs } from '@/lib/collections/revisions/newSchema';
import { graphqlTypeDefs as additionalTagsTypeDefs } from '@/lib/collections/tags/newSchema';
import { graphqlTypeDefs as additionalUsersTypeDefs } from '@/lib/collections/users/newSchema';
import { graphqlTypeDefs as recommendationsTypeDefs, graphqlQueries as recommendationsQueries } from '@/server/recommendations';
import { graphqlTypeDefs as userResolversTypeDefs, graphqlMutations as userResolversMutations, graphqlQueries as userResolversQueries } from '@/server/resolvers/userResolvers';
import { graphqlVoteTypeDefs as postVoteTypeDefs, graphqlVoteMutations as postVoteMutations } from '@/server/collections/posts/collection';
import { graphqlVoteTypeDefs as commentVoteTypeDefs, graphqlVoteMutations as commentVoteMutations } from '@/server/collections/comments/collection';
import { graphqlVoteTypeDefs as tagRelVoteTypeDefs, graphqlVoteMutations as tagRelVoteMutations } from '@/server/collections/tagRels/collection';
import { graphqlVoteTypeDefs as revisionVoteTypeDefs, graphqlVoteMutations as revisionVoteMutations } from '@/server/collections/revisions/collection';
import { graphqlVoteTypeDefs as electionCandidateVoteTypeDefs, graphqlVoteMutations as electionCandidateVoteMutations } from '@/server/collections/electionCandidates/collection';
import { graphqlVoteTypeDefs as tagVoteTypeDefs, graphqlVoteMutations as tagVoteMutations } from '@/server/collections/tags/collection';
import { graphqlVoteTypeDefs as multiDocumentVoteTypeDefs, graphqlVoteMutations as multiDocumentVoteMutations } from '@/server/collections/multiDocuments/collection';
import { graphqlTypeDefs as commentTypeDefs, graphqlMutations as commentMutations, graphqlQueries as commentQueries } from '@/server/resolvers/commentResolvers'
import { karmaChangesTypeDefs, karmaChangesFieldResolvers } from '@/server/collections/users/karmaChangesGraphQL';
import { analyticsGraphQLQueries, analyticsGraphQLTypeDefs } from '@/server/resolvers/analyticsResolvers';
import { arbitalGraphQLTypeDefs, arbitalGraphQLQueries } from '@/server/resolvers/arbitalPageData';
import { coronaLinkDatabaseGraphQLTypeDefs, coronaLinkDatabaseGraphQLQueries } from '@/server/resolvers/coronaLinkDatabase';
import { elicitPredictionsGraphQLTypeDefs, elicitPredictionsGraphQLQueries, elicitPredictionsGraphQLFieldResolvers, elicitPredictionsGraphQLMutations } from '@/server/resolvers/elicitPredictions';
import { notificationResolversGqlTypeDefs, notificationResolversGqlQueries, notificationResolversGqlMutations } from '@/server/resolvers/notificationResolvers'
import { lightcone2024FundraiserGraphQLTypeDefs, lightcone2024FundraiserGraphQLQueries } from '@/server/resolvers/lightcone2024FundraiserResolvers';
import { petrovDay2024GraphQLQueries, petrovDay2024GraphQLTypeDefs } from '@/server/resolvers/petrovDay2024Resolvers';
import { petrovDayLaunchGraphQLMutations, petrovDayLaunchGraphQLQueries, petrovDayLaunchGraphQLTypeDefs } from '@/server/resolvers/petrovDayResolvers';
import { reviewVoteGraphQLMutations, reviewVoteGraphQLTypeDefs, reviewVoteGraphQLQueries } from '@/server/resolvers/reviewVoteResolvers';
import { postGqlQueries, postGqlMutations, postGqlTypeDefs } from '@/server/resolvers/postResolvers'
import { adminGqlTypeDefs, adminGqlMutations } from '@/server/resolvers/adminResolvers'
import { alignmentForumMutations, alignmentForumTypeDefs } from '@/server/resolvers/alignmentForumMutations'
import { allTagsActivityFeedGraphQLQueries, allTagsActivityFeedGraphQLTypeDefs } from '@/server/resolvers/allTagsActivityFeed';
import { recentDiscussionFeedGraphQLQueries, recentDiscussionFeedGraphQLTypeDefs } from '@/server/resolvers/recentDiscussionFeed';
import { subscribedUsersFeedGraphQLQueries, subscribedUsersFeedGraphQLTypeDefs } from '@/server/resolvers/subscribedUsersFeedResolver';
import { tagHistoryFeedGraphQLQueries, tagHistoryFeedGraphQLTypeDefs } from '@/server/resolvers/tagHistoryFeed';
import { subForumFeedGraphQLQueries, subForumFeedGraphQLTypeDefs, tagGraphQLTypeDefs, tagResolversGraphQLMutations, tagResolversGraphQLQueries } from '@/server/resolvers/tagResolvers';
import { conversationGqlMutations, conversationGqlTypeDefs } from '@/server/resolvers/conversationResolvers'
import { surveyResolversGraphQLMutations, surveyResolversGraphQLQueries, surveyResolversGraphQLTypeDefs } from '@/server/resolvers/surveyResolvers';
import { wrappedResolversGqlTypeDefs, wrappedResolversGraphQLQueries } from '@/server/resolvers/wrappedResolvers';
import { databaseSettingsGqlTypeDefs, databaseSettingsGqlMutations } from '@/server/resolvers/databaseSettingsResolvers'
import { siteGraphQLQueries, siteGraphQLTypeDefs } from '../site';
import { loginDataGraphQLMutations, loginDataGraphQLTypeDefs } from './authentication';
import { dialogueMessageGqlQueries, dialogueMessageGqlTypeDefs } from '@/server/resolvers/dialogueMessageResolvers';
import { forumEventGqlMutations, forumEventGqlTypeDefs } from '@/server/resolvers/forumEventResolvers';
import { ckEditorCallbacksGraphQLMutations, ckEditorCallbacksGraphQLTypeDefs, getLinkSharedPostGraphQLQueries } from '@/server/ckEditor/ckEditorCallbacks';
import { googleVertexGqlMutations, googleVertexGqlTypeDefs } from '@/server/resolvers/googleVertexResolvers';
import { migrationsDashboardGraphQLQueries, migrationsDashboardGraphQLTypeDefs } from '@/server/manualMigrations/migrationsDashboardGraphql';
import { reviewWinnerGraphQLQueries, reviewWinnerGraphQLTypeDefs } from '@/server/resolvers/reviewWinnerResolvers';
import { importUrlAsDraftPostGqlMutation, importUrlAsDraftPostTypeDefs } from '@/server/resolvers/importUrlAsDraftPost';
import { revisionResolversGraphQLQueries, revisionResolversGraphQLMutations, revisionResolversGraphQLTypeDefs } from '@/server/resolvers/revisionResolvers';
import { moderationGqlMutations, moderationGqlQueries, moderationGqlTypeDefs } from '@/server/resolvers/moderationResolvers';
import { multiDocumentMutations, multiDocumentTypeDefs } from '@/server/resolvers/multiDocumentResolvers';
import { spotlightGqlMutations, spotlightGqlTypeDefs } from '@/server/resolvers/spotlightResolvers';
import { typingIndicatorsGqlMutations, typingIndicatorsGqlTypeDefs } from '@/server/resolvers/typingIndicatorsResolvers';
import { acceptCoauthorRequestMutations, acceptCoauthorRequestTypeDefs } from '@/server/acceptCoauthorRequest';
import { bookmarkGqlMutations, bookmarkGqlTypeDefs } from '@/server/bookmarkMutation';
import { hidePostGqlMutations, hidePostGqlTypeDefs } from '@/server/hidePostMutation';
import { markAsUnreadMutations, markAsUnreadTypeDefs } from '@/server/markAsUnread';
import { cronGraphQLMutations, cronGraphQLQueries, cronGraphQLTypeDefs } from '@/server/rss-integration/cron';
import { partiallyReadSequencesMutations, partiallyReadSequencesTypeDefs } from '@/server/partiallyReadSequences';
import { jargonTermsGraphQLMutations, jargonTermsGraphQLTypeDefs } from '@/server/resolvers/jargonResolvers/jargonTermMutations';
import { rsvpToEventsMutations, rsvpToEventsTypeDefs } from '@/server/rsvpToEvent';
import { siteAdminMetadataGraphQLQueries, siteAdminMetadataGraphQLTypeDefs } from '@/server/siteAdminMetadata';
import { tagsGqlMutations, tagsGqlTypeDefs } from '@/server/tagging/tagsGraphQL';
import { analyticsEventGraphQLMutations, analyticsEventTypeDefs } from '@/server/analytics/serverAnalyticsWriter';
import { usersGraphQLQueries, usersGraphQLTypeDefs } from '@/server/collections/users/collection';
import { elasticGqlMutations, elasticGqlQueries, elasticGqlTypeDefs } from '@/server/search/elastic/elasticGraphQL';
import { emailTokensGraphQLMutations, emailTokensGraphQLTypeDefs } from '@/server/emails/emailTokens';
import { fmCrosspostGraphQLMutations, fmCrosspostGraphQLQueries, fmCrosspostGraphQLTypeDefs } from '@/server/fmCrosspost/resolvers';
import { diffGqlQueries, diffGqlTypeDefs } from '@/server/resolvers/diffResolvers';
import { recommendationsGqlMutations, recommendationsGqlTypeDefs } from '@/server/recommendations/mutations';
import { extraPostResolversGraphQLMutations, extraPostResolversGraphQLTypeDefs } from '@/server/posts/graphql';
import { getSchema } from '@/lib/schema/allSchemas';
import { unlockablesGqlTypeDefs, unlockablesGraphQLMutations, unlockablesGraphQLQueries } from '@/server/loot/unlocks';

export const typeDefs = gql`
  # type Query
  # type Mutation
  ${notificationTypeDefs}
  ${arbitalLinkedPagesTypeDefs}
  ${additionalPostsTypeDefs}
  ${additionalRevisionsTypeDefs}
  ${additionalTagsTypeDefs}
  ${additionalUsersTypeDefs}
  ${recommendationsTypeDefs}
  ${userResolversTypeDefs}
  # # Vote typedefs
  ${postVoteTypeDefs}
  ${commentVoteTypeDefs}
  ${tagRelVoteTypeDefs}
  ${revisionVoteTypeDefs}
  ${electionCandidateVoteTypeDefs}
  ${tagVoteTypeDefs}
  ${multiDocumentVoteTypeDefs}
  ${commentTypeDefs}
  # # End vote typedefs
  ${karmaChangesTypeDefs}
  ${analyticsGraphQLTypeDefs}
  ${arbitalGraphQLTypeDefs}
  ${coronaLinkDatabaseGraphQLTypeDefs}
  ${elicitPredictionsGraphQLTypeDefs}
  ${notificationResolversGqlTypeDefs}
  ${lightcone2024FundraiserGraphQLTypeDefs}
  ${petrovDay2024GraphQLTypeDefs}
  ${petrovDayLaunchGraphQLTypeDefs}
  ${reviewVoteGraphQLTypeDefs}
  ${postGqlTypeDefs}
  ${adminGqlTypeDefs}
  ${alignmentForumTypeDefs}
  ${allTagsActivityFeedGraphQLTypeDefs}
  ${recentDiscussionFeedGraphQLTypeDefs}
  ${subscribedUsersFeedGraphQLTypeDefs}
  ${tagHistoryFeedGraphQLTypeDefs}
  ${subForumFeedGraphQLTypeDefs}
  ${conversationGqlTypeDefs}
  ${surveyResolversGraphQLTypeDefs}
  ${tagGraphQLTypeDefs}
  ${wrappedResolversGqlTypeDefs}
  ${databaseSettingsGqlTypeDefs}
  ${siteGraphQLTypeDefs}
  ${loginDataGraphQLTypeDefs}
  ${dialogueMessageGqlTypeDefs}
  ${forumEventGqlTypeDefs}
  ${ckEditorCallbacksGraphQLTypeDefs}
  ${migrationsDashboardGraphQLTypeDefs}
  ${reviewWinnerGraphQLTypeDefs}
  ${googleVertexGqlTypeDefs}
  ${importUrlAsDraftPostTypeDefs}
  ${revisionResolversGraphQLTypeDefs}
  ${moderationGqlTypeDefs}
  ${multiDocumentTypeDefs}
  ${spotlightGqlTypeDefs}
  ${typingIndicatorsGqlTypeDefs}
  ${acceptCoauthorRequestTypeDefs}
  ${bookmarkGqlTypeDefs}
  ${hidePostGqlTypeDefs}
  ${markAsUnreadTypeDefs}
  ${cronGraphQLTypeDefs}
  ${partiallyReadSequencesTypeDefs}
  ${jargonTermsGraphQLTypeDefs}
  ${rsvpToEventsTypeDefs}
  ${siteAdminMetadataGraphQLTypeDefs}
  ${tagsGqlTypeDefs}
  ${analyticsEventTypeDefs}
  ${usersGraphQLTypeDefs}
  ${elasticGqlTypeDefs}
  ${emailTokensGraphQLTypeDefs}
  ${fmCrosspostGraphQLTypeDefs}
  ${diffGqlTypeDefs}
  ${recommendationsGqlTypeDefs}
  ${extraPostResolversGraphQLTypeDefs}
  ${unlockablesGqlTypeDefs}
`

export const resolvers = {
  Query: {
    ...userResolversQueries,
    ...recommendationsQueries,
    ...notificationQueries,
    ...commentQueries,
    ...analyticsGraphQLQueries,
    ...arbitalGraphQLQueries,
    ...coronaLinkDatabaseGraphQLQueries,
    ...elicitPredictionsGraphQLQueries,
    ...notificationResolversGqlQueries,
    ...elicitPredictionsGraphQLQueries,
    ...lightcone2024FundraiserGraphQLQueries,
    ...petrovDay2024GraphQLQueries,
    ...petrovDayLaunchGraphQLQueries,
    ...reviewVoteGraphQLQueries,
    ...postGqlQueries,
    ...allTagsActivityFeedGraphQLQueries,
    ...recentDiscussionFeedGraphQLQueries,
    ...subscribedUsersFeedGraphQLQueries,
    ...tagHistoryFeedGraphQLQueries,
    ...subForumFeedGraphQLQueries,
    ...wrappedResolversGraphQLQueries,
    ...siteGraphQLQueries,
    ...dialogueMessageGqlQueries,
    ...getLinkSharedPostGraphQLQueries,
    ...migrationsDashboardGraphQLQueries,
    ...reviewWinnerGraphQLQueries,  
    ...revisionResolversGraphQLQueries,
    ...moderationGqlQueries,
    ...tagResolversGraphQLQueries,
    ...cronGraphQLQueries,
    ...siteAdminMetadataGraphQLQueries,
    ...usersGraphQLQueries,
    ...elasticGqlQueries,
    ...fmCrosspostGraphQLQueries,
    ...diffGqlQueries,
    ...surveyResolversGraphQLQueries,
    ...tagResolversGraphQLQueries,
    ...unlockablesGraphQLQueries,
  },
  Mutation: {
    ...userResolversMutations,
    ...postVoteMutations,
    ...commentVoteMutations,
    ...tagRelVoteMutations,
    ...revisionVoteMutations,
    ...electionCandidateVoteMutations,
    ...tagVoteMutations,
    ...multiDocumentVoteMutations,
    ...commentMutations,
    ...notificationResolversGqlMutations,
    ...elicitPredictionsGraphQLMutations,
    ...petrovDayLaunchGraphQLMutations,
    ...reviewVoteGraphQLMutations,
    ...postGqlMutations,
    ...adminGqlMutations,
    ...alignmentForumMutations,
    ...conversationGqlMutations,
    ...databaseSettingsGqlMutations,
    ...forumEventGqlMutations,
    ...googleVertexGqlMutations,
    ...ckEditorCallbacksGraphQLMutations,
    ...importUrlAsDraftPostGqlMutation,
    ...revisionResolversGraphQLMutations,
    ...moderationGqlMutations,
    ...multiDocumentMutations,
    ...spotlightGqlMutations,
    ...typingIndicatorsGqlMutations,
    ...tagResolversGraphQLMutations,
    ...acceptCoauthorRequestMutations,
    ...bookmarkGqlMutations,
    ...hidePostGqlMutations,
    ...markAsUnreadMutations,
    ...cronGraphQLMutations,
    ...partiallyReadSequencesMutations,
    ...jargonTermsGraphQLMutations,
    ...rsvpToEventsMutations,
    ...tagsGqlMutations,
    ...analyticsEventGraphQLMutations,
    ...elasticGqlMutations,
    ...emailTokensGraphQLMutations,
    ...fmCrosspostGraphQLMutations,
    ...surveyResolversGraphQLMutations, 
    ...recommendationsGqlMutations,
    ...extraPostResolversGraphQLMutations,
    ...loginDataGraphQLMutations,
  },
  ...karmaChangesFieldResolvers,
  ...elicitPredictionsGraphQLFieldResolvers,
  ...unlockablesGraphQLMutations,
}


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
    const collectionName = nullableScalarType in typeNameToCollectionName
      ? typeNameToCollectionName[nullableScalarType as keyof typeof typeNameToCollectionName]
      : null;

    return collectionName ? {collectionName, isArray} : null;
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
const getFields = <N extends CollectionNameString>(schema: NewSchemaType<N>, typeName: string): {
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
    const { graphql } = field;
    // only include fields that are viewable/insertable/editable
    if (!graphql || (!(graphql.canRead.length || graphql.canCreate?.length || graphql.canUpdate?.length) && !graphql.forceIncludeInExecutableSchema)) {
      return;
    }

    const fieldType = getGraphQLType(graphql);
    const inputFieldType = getGraphQLType(graphql, true);

    const fieldDirective = '';
    const fieldArguments: Array<any> = [];

    // if field has a resolveAs, push it to schema
    if (graphql.resolver) {
      const resolverName = fieldName;

      // first push its type definition
      // include arguments if there are any
      fields.mainType.push({
        description: '',
        name: resolverName,
        args: graphql.arguments,
        type: fieldType,
      });

      const permissionData = getSqlResolverPermissionsData(fieldType);

      // then build actual resolver object and pass it to addGraphQLResolvers
      const resolver = {
        [typeName]: {
          [resolverName]: (document: ObjectsByCollectionName[N], args: any, context: ResolverContext) => {
            // Check that current user has permission to access the original
            // non-resolved field.
            if (!userCanReadField(context.currentUser, graphql.canRead, document)) {
              return null;
            }

            // First, check if the value was already fetched by a SQL resolver.
            // A field with a SQL resolver that returns no value (for instance,
            // if it uses a LEFT JOIN and no matching object is found) can be
            // distinguished from a field with no SQL resolver as the former
            // will be `null` and the latter will be `undefined`.
            if (graphql.sqlResolver) {
              const typedName = resolverName as keyof ObjectsByCollectionName[N];
              let existingValue = document[typedName];
              if (existingValue !== undefined) {
                const {sqlPostProcess} = graphql;
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
                    context,
                  );
                }
                return existingValue;
              }
            }

            // If the value wasn't supplied by a SQL resolver then we need
            // to run the code resolver instead.
            return graphql.resolver!(document, args, context);
          },
        },
      };

      addedResolvers.push(resolver);
    } else {
      // try to guess GraphQL type
      if (fieldType) {
        fields.mainType.push({
          description: '',
          name: fieldName,
          args: fieldArguments,
          type: fieldType,
          directive: fieldDirective,
        });
      }
    }

    const createFieldType = inputFieldType === 'Revision'
      ? 'JSON'
      : inputFieldType;

    // Fields should not be required for updates
    const updateFieldType = (typeof createFieldType === 'string' && createFieldType.endsWith('!'))
      ? createFieldType.slice(0, -1)
      : createFieldType;

    // OpenCRUD backwards compatibility
    if (graphql.canCreate?.length) {
      fields.create.push({
        name: fieldName,
        type: createFieldType,
      });
    }
    // OpenCRUD backwards compatibility
    if (graphql.canUpdate?.length) {
      fields.update.push({
        name: fieldName,
        type: updateFieldType,
      });
    }
  });
  return { fields, resolvers: addedResolvers };
};

// generate a GraphQL schema corresponding to a given collection
export const generateSchema = (collection: CollectionBase<CollectionNameString>) => {
  let graphQLSchema = '';

  const schemaFragments: Array<string> = [];

  const collectionName = collection.collectionName;

  const typeName = collection.typeName
    ? collection.typeName
    : camelToSpaces(_.initial(collectionName).join('')); // default to posts -> Post

  const schema = getSchema(collectionName);

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
    addedMutations,
    addedResolvers,
  };
};
