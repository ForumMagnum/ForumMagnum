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
  
  input TagDefaultViewInput {
    excludedTagIds: String
  }
  
  input TagsTagsByTagIdsInput {
    excludedTagIds: String
    tagIds: String
  }
  
  input TagsAllTagsAlphabeticalInput {
    excludedTagIds: String
  }
  
  input TagsUserTagsInput {
    excludedTagIds: String
    userId: String
  }
  
  input TagsCurrentUserSubforumsInput {
    excludedTagIds: String
  }
  
  input TagsAllPagesByNewestInput {
    excludedTagIds: String
  }
  
  input TagsAllTagsHierarchicalInput {
    excludedTagIds: String
    wikiGrade: String
  }
  
  input TagsTagBySlugInput {
    excludedTagIds: String
    slug: String
  }
  
  input TagsTagsBySlugsInput {
    excludedTagIds: String
    slugs: String
  }
  
  input TagsCoreTagsInput {
    excludedTagIds: String
  }
  
  input TagsPostTypeTagsInput {
    excludedTagIds: String
  }
  
  input TagsCoreAndSubforumTagsInput {
    excludedTagIds: String
  }
  
  input TagsNewTagsInput {
    excludedTagIds: String
  }
  
  input TagsUnreviewedTagsInput {
    excludedTagIds: String
  }
  
  input TagsSuggestedFilterTagsInput {
    excludedTagIds: String
  }
  
  input TagsAllLWWikiTagsInput {
    excludedTagIds: String
  }
  
  input TagsUnprocessedLWWikiTagsInput {
    excludedTagIds: String
  }
  
  input TagsTagsByTagFlagInput {
    excludedTagIds: String
    tagFlagId: String
  }
  
  input TagsAllPublicTagsInput {
    excludedTagIds: String
  }
  
  input TagsAllArbitalTagsInput {
    excludedTagIds: String
  }
  
  input TagsPingbackWikiPagesInput {
    excludedTagIds: String
  }
  
  input TagSelector  {
    default: TagDefaultViewInput
    tagsByTagIds: TagsTagsByTagIdsInput
    allTagsAlphabetical: TagsAllTagsAlphabeticalInput
    userTags: TagsUserTagsInput
    currentUserSubforums: TagsCurrentUserSubforumsInput
    allPagesByNewest: TagsAllPagesByNewestInput
    allTagsHierarchical: TagsAllTagsHierarchicalInput
    tagBySlug: TagsTagBySlugInput
    tagsBySlugs: TagsTagsBySlugsInput
    coreTags: TagsCoreTagsInput
    postTypeTags: TagsPostTypeTagsInput
    coreAndSubforumTags: TagsCoreAndSubforumTagsInput
    newTags: TagsNewTagsInput
    unreviewedTags: TagsUnreviewedTagsInput
    suggestedFilterTags: TagsSuggestedFilterTagsInput
    allLWWikiTags: TagsAllLWWikiTagsInput
    unprocessedLWWikiTags: TagsUnprocessedLWWikiTagsInput
    tagsByTagFlag: TagsTagsByTagFlagInput
    allPublicTags: TagsAllPublicTagsInput
    allArbitalTags: TagsAllArbitalTagsInput
    pingbackWikiPages: TagsPingbackWikiPagesInput
  }
  
  input MultiTagInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
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
