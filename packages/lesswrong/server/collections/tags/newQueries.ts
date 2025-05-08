import schema from "@/lib/collections/tags/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { TagsViews } from "@/lib/collections/tags/views";

export const graphqlTagQueryTypeDefs = gql`
  type Tag ${
    getAllGraphQLFields(schema)
  }

  input SingleTagInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleTagOutput {
    result: Tag
  }
  
  input ViewInput {
    userId: String
    wikiGrade: String
    slug: String
    slugs: [String!]
    tagFlagId: String
    parentTagId: String
    tagId: String
    tagIds: [String!]
    excludedTagIds: [String!]
  }

  input TagSelector @oneOf {
    tagsByTagIds: ViewInput
    allTagsAlphabetical: ViewInput
    userTags: ViewInput
    currentUserSubforums: ViewInput
    allPagesByNewest: ViewInput
    allTagsHierarchical: ViewInput
    tagBySlug: ViewInput
    tagsBySlugs: ViewInput
    coreTags: ViewInput
    postTypeTags: ViewInput
    coreAndSubforumTags: ViewInput
    newTags: ViewInput
    unreviewedTags: ViewInput
    suggestedFilterTags: ViewInput
    allLWWikiTags: ViewInput
    unprocessedLWWikiTags: ViewInput
    tagsByTagFlag: ViewInput
    allPublicTags: ViewInput
    allArbitalTags: ViewInput
    pingbackWikiPages: ViewInput
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
    tag(input: SingleTagInput): SingleTagOutput
    tags(
      input: MultiTagInput @deprecated(reason: "Use the selector field instead"), 
      selector: TagSelector, 
      limit: Int, offset: Int, 
      enableTotal: Boolean
    ): MultiTagOutput
  }
`;

export const tagGqlQueryHandlers = getDefaultResolvers('Tags', TagsViews);
export const tagGqlFieldResolvers = getFieldGqlResolvers('Tags', schema);
