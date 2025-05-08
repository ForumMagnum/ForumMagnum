import schema from "@/lib/collections/localgroups/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { LocalgroupsViews } from "@/lib/collections/localgroups/views";

export const graphqlLocalgroupQueryTypeDefs = gql`
  type Localgroup ${ getAllGraphQLFields(schema) }
  
  input SingleLocalgroupInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleLocalgroupOutput {
    result: Localgroup
  }
  
  input LocalgroupViewInput {
    filters: String
    groupId: String
    userId: String
    lng: String
    lat: String
    includeInactive: String
   }
  
  input LocalgroupSelector @oneOf {
    default: LocalgroupViewInput
    userOrganizesGroups: LocalgroupViewInput
    userActiveGroups: LocalgroupViewInput
    userInactiveGroups: LocalgroupViewInput
    all: LocalgroupViewInput
    nearby: LocalgroupViewInput
    single: LocalgroupViewInput
    local: LocalgroupViewInput
    online: LocalgroupViewInput
  }
  
  input MultiLocalgroupInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiLocalgroupOutput {
    results: [Localgroup]
    totalCount: Int
  }
  
  extend type Query {
    localgroup(
      input: SingleLocalgroupInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleLocalgroupOutput
    localgroups(
      input: MultiLocalgroupInput @deprecated(reason: "Use the selector field instead"),
      selector: LocalgroupSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiLocalgroupOutput
  }
`;
export const localgroupGqlQueryHandlers = getDefaultResolvers('Localgroups', LocalgroupsViews);
export const localgroupGqlFieldResolvers = getFieldGqlResolvers('Localgroups', schema);
