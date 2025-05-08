import schema from "@/lib/collections/moderationTemplates/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ModerationTemplatesViews } from "@/lib/collections/moderationTemplates/views";

export const graphqlModerationTemplateQueryTypeDefs = gql`
  type ModerationTemplate ${ getAllGraphQLFields(schema) }
  
  input SingleModerationTemplateInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleModerationTemplateOutput {
    result: ModerationTemplate
  }
  
  input ModerationTemplateDefaultViewInput
  
  input ModerationTemplatesModerationTemplatesPageInput
  
  input ModerationTemplatesModerationTemplatesListInput {
    collectionName: String
  }
  
  input ModerationTemplateSelector  {
    default: ModerationTemplateDefaultViewInput
    moderationTemplatesPage: ModerationTemplatesModerationTemplatesPageInput
    moderationTemplatesList: ModerationTemplatesModerationTemplatesListInput
  }
  
  input MultiModerationTemplateInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiModerationTemplateOutput {
    results: [ModerationTemplate]
    totalCount: Int
  }
  
  extend type Query {
    moderationTemplate(
      input: SingleModerationTemplateInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleModerationTemplateOutput
    moderationTemplates(
      input: MultiModerationTemplateInput @deprecated(reason: "Use the selector field instead"),
      selector: ModerationTemplateSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiModerationTemplateOutput
  }
`;
export const moderationTemplateGqlQueryHandlers = getDefaultResolvers('ModerationTemplates', ModerationTemplatesViews);
export const moderationTemplateGqlFieldResolvers = getFieldGqlResolvers('ModerationTemplates', schema);
