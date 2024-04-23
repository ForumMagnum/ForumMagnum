import { DocumentServiceClient, UserEventServiceClient, v1beta } from "@google-cloud/discoveryengine";
import { onStartup } from "../../lib/executionEnvironment";
import { googleRecommendationsCredsPath } from "../../lib/instanceSettings";
import { filterNonnull } from "../../lib/utils/typeGuardUtils";
import { loadByIds } from "../../lib/loaders";
import { accessFilterMultiple } from "../../lib/utils/schemaUtils";

const { RecommendationServiceClient } = v1beta;

onStartup(() => {
  const credsPath = googleRecommendationsCredsPath.get();
  if (credsPath) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
  }
});

const getGoogleClientInstance = <T extends new () => InstanceType<T>>(constructor: T): () => InstanceType<T> => ((ClientConstructor: T) => {
  let client: InstanceType<T>;
  return () => {
    if (!client) {
      client = new ClientConstructor();
    }

    return client;
  };
})(constructor);

const clients = {
  documents: getGoogleClientInstance(DocumentServiceClient),
  userEvents: getGoogleClientInstance(UserEventServiceClient),
  recommendations: getGoogleClientInstance(RecommendationServiceClient),
};

const googleVertexApi = {
  async getRecommendations(context: ResolverContext) {
    const client = clients.recommendations();
    const [recommendationsResponse] = await client.recommend({ validateOnly: false, servingConfig: '' });
    if (!recommendationsResponse.results) {
      // TODO: error?
      // eslint-disable-next-line no-console
      console.log(`Didn't get back a response with any results from google!`);
      return [];
    }

    const postIds = filterNonnull(recommendationsResponse.results.map(result => result.document?.id));
    const posts = filterNonnull(await loadByIds(context, 'Posts', postIds));
    const filteredPosts = await accessFilterMultiple(context.currentUser, context.Posts, posts, context);

    const attributionId = recommendationsResponse.attributionToken;

    const postsWithAttribution = filteredPosts.map(post => ({ post, attributionId }));

    return postsWithAttribution;
  }
};

export { clients, googleVertexApi };
