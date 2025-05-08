import schema from "@/lib/collections/tags/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { TagsViews } from "@/lib/collections/tags/views";

export const graphqlTagQueryTypeDefs = gql`
  type Tag ${ getAllGraphQLFields(schema) }
  
  input SingleTagInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleTagOutput {
    result: Tag
  }
  
  input TagViewInput {
    userId: String
    wikiGrade: String
    slug: String
    slugs: String
    tagFlagId: String
    parentTagId: String
    tagId: String
    tagIds: String
    excludedTagIds: String
   }
  
  input TagSelector @oneOf {
    default: TagViewInput
    tagsByTagIds: TagViewInput
    allTagsAlphabetical: TagViewInput
    userTags: TagViewInput
    currentUserSubforums: TagViewInput
    allPagesByNewest: TagViewInput
    allTagsHierarchical: TagViewInput
    tagBySlug: TagViewInput
    tagsBySlugs: TagViewInput
    coreTags: TagViewInput
    postTypeTags: TagViewInput
    coreAndSubforumTags: TagViewInput
    newTags: TagViewInput
    unreviewedTags: TagViewInput
    suggestedFilterTags: TagViewInput
    allLWWikiTags: TagViewInput
    unprocessedLWWikiTags: TagViewInput
    tagsByTagFlag: TagViewInput
    allPublicTags: TagViewInput
    allArbitalTags: TagViewInput
    pingbackWikiPages: TagViewInput
  }
  
  input MultiTagInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiTagOutput {
    results: [Tag]
    totalCount: Int
  }
  
  extend type Query {
    tag(
      input: SingleTagInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleTagOutput
    tags(
      input: MultiTagInput @deprecated(reason: "Use the selector field instead"),
      selector: TagSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiTagOutput
  }
`;
export const tagGqlQueryHandlers = getDefaultResolvers('Tags', TagsViews);
export const tagGqlFieldResolvers = getFieldGqlResolvers('Tags', schema);
