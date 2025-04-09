import schema from "@/lib/collections/moderationTemplates/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlModerationTemplateQueryTypeDefs = gql`
  type ModerationTemplate ${
    getAllGraphQLFields(schema)
  }

  input SingleModerationTemplateInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleModerationTemplateOutput {
    result: ModerationTemplate
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
    moderationTemplate(input: SingleModerationTemplateInput): SingleModerationTemplateOutput
    moderationTemplates(input: MultiModerationTemplateInput): MultiModerationTemplateOutput
  }
`;

export const moderationTemplateGqlQueryHandlers = getDefaultResolvers('ModerationTemplates');
export const moderationTemplateGqlFieldResolvers = getFieldGqlResolvers('ModerationTemplates', schema);
