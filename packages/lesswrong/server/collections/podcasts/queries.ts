import schema from "@/lib/collections/podcasts/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CollectionViewSet } from "@/lib/views/collectionViewSet";

export const graphqlPodcastQueryTypeDefs = gql`
  type Podcast ${ getAllGraphQLFields(schema) }
  
  input SinglePodcastInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SinglePodcastOutput {
    result: Podcast
  }
  
  input PodcastViewInput
  
  input PodcastSelector @oneOf {
    default: PodcastViewInput
  }
  
  input MultiPodcastInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiPodcastOutput {
    results: [Podcast]
    totalCount: Int
  }
  
  extend type Query {
    podcast(
      input: SinglePodcastInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SinglePodcastOutput
    podcasts(
      input: MultiPodcastInput @deprecated(reason: "Use the selector field instead"),
      selector: PodcastSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiPodcastOutput
  }
`;
export const podcastGqlQueryHandlers = getDefaultResolvers('Podcasts', new CollectionViewSet('Podcasts', {}));
export const podcastGqlFieldResolvers = getFieldGqlResolvers('Podcasts', schema);
