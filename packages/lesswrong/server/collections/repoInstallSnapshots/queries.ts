import schema from "@/lib/collections/repoInstallSnapshots/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlRepoInstallSnapshotQueryTypeDefs = gql`
  type RepoInstallSnapshot ${ getAllGraphQLFields(schema) }
`;

export const repoInstallSnapshotGqlFieldResolvers = getFieldGqlResolvers('RepoInstallSnapshots', schema);
