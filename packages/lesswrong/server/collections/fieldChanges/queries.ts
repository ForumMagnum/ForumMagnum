import schema from "@/lib/collections/fieldChanges/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { FieldChangesViews } from "@/lib/collections/fieldChanges/views";

export const graphqlFieldChangeQueryTypeDefs = gql`
  type FieldChange ${ getAllGraphQLFields(schema) }
  
  input SingleFieldChangeInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleFieldChangeOutput {
    result: FieldChange
  }
  
  
  
  input FieldChangeSelector {
    default: EmptyViewInput
  }
  
  input MultiFieldChangeInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiFieldChangeOutput {
    results: [FieldChange!]!
    totalCount: Int
  }
  
  extend type Query {
    fieldChange(
      input: SingleFieldChangeInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleFieldChangeOutput
    fieldChanges(
      input: MultiFieldChangeInput @deprecated(reason: "Use the selector field instead"),
      selector: FieldChangeSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiFieldChangeOutput
  }
`;
export const fieldChangeGqlQueryHandlers = getDefaultResolvers('FieldChanges', FieldChangesViews);
export const fieldChangeGqlFieldResolvers = getFieldGqlResolvers('FieldChanges', schema);
