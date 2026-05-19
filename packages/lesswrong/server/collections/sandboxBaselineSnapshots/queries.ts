import schema from "@/lib/collections/sandboxBaselineSnapshots/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlSandboxBaselineSnapshotQueryTypeDefs = gql`
  type SandboxBaselineSnapshot ${ getAllGraphQLFields(schema) }
`;

export const sandboxBaselineSnapshotGqlFieldResolvers = getFieldGqlResolvers('SandboxBaselineSnapshots', schema);
