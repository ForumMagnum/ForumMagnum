import schema from "@/lib/collections/revisionOriginalContents/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlRevisionOriginalContentsQueryTypeDefs = gql`
  type RevisionOriginalContent ${
    getAllGraphQLFields(schema)
  }
`;

export const revisionOriginalContentsGqlFieldResolvers = getFieldGqlResolvers('RevisionOriginalContents', schema);
