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
    filters: [String!]
    includeInactive: Boolean
  }
  
  input LocalgroupsUserOrganizesGroupsInput {
    filters: [String!]
    includeInactive: Boolean
    userId: String
  }
  
  input LocalgroupsUserActiveGroupsInput {
    filters: [String!]
    includeInactive: Boolean
    userId: String
  }
  
  input LocalgroupsUserInactiveGroupsInput {
    filters: [String!]
    includeInactive: Boolean
    userId: String
  }
  
  input LocalgroupsAllInput {
    filters: [String!]
    includeInactive: Boolean
  }
  
  input LocalgroupsNearbyInput {
    filters: [String!]
    includeInactive: Boolean
    lng: Float
    lat: Float
  }
  
  input LocalgroupsSingleInput {
    filters: [String!]
    includeInactive: Boolean
    groupId: String
  }
  
  input LocalgroupsLocalInput {
    filters: [String!]
    includeInactive: Boolean
  }
  
  input LocalgroupsOnlineInput {
    filters: [String!]
    includeInactive: Boolean
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
    enableCache: Boolean
  }
  
  type MultiLocalgroupOutput {
    results: [Localgroup!]!
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
