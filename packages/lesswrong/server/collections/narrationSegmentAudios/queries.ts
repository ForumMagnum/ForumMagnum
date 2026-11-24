import schema from "@/lib/collections/narrationSegmentAudios/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlNarrationSegmentAudioQueryTypeDefs = gql`
  type NarrationSegmentAudio ${ getAllGraphQLFields(schema) }
`;

export const narrationSegmentAudioGqlFieldResolvers = getFieldGqlResolvers('NarrationSegmentAudios', schema);
