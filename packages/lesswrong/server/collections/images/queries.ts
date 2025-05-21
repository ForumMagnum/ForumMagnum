import schema from "@/lib/collections/images/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlImagesQueryTypeDefs = gql`
  type Images {
    ${getAllGraphQLFields(schema)}
  }
`;

export const imagesGqlFieldResolvers = getFieldGqlResolvers('Images', schema);
