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
  
  input LocalgroupDefaultViewInput {
    filters: String
    includeInactive: String
  }
  
  input LocalgroupsUserOrganizesGroupsInput {
    filters: String
    includeInactive: String
    userId: String
  }
  
  input LocalgroupsUserActiveGroupsInput {
    filters: String
    includeInactive: String
    userId: String
  }
  
  input LocalgroupsUserInactiveGroupsInput {
    filters: String
    includeInactive: String
    userId: String
  }
  
  input LocalgroupsAllInput {
    filters: String
    includeInactive: String
  }
  
  input LocalgroupsNearbyInput {
    filters: String
    includeInactive: String
    lng: String
    lat: String
  }
  
  input LocalgroupsSingleInput {
    filters: String
    includeInactive: String
    groupId: String
  }
  
  input LocalgroupsLocalInput {
    filters: String
    includeInactive: String
  }
  
  input LocalgroupsOnlineInput {
    filters: String
    includeInactive: String
  }
  
  input LocalgroupSelector  {
    default: LocalgroupDefaultViewInput
    userOrganizesGroups: LocalgroupsUserOrganizesGroupsInput
    userActiveGroups: LocalgroupsUserActiveGroupsInput
    userInactiveGroups: LocalgroupsUserInactiveGroupsInput
    all: LocalgroupsAllInput
    nearby: LocalgroupsNearbyInput
    single: LocalgroupsSingleInput
    local: LocalgroupsLocalInput
    online: LocalgroupsOnlineInput
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
