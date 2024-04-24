import { DocumentServiceClient, UserEventServiceClient, v1beta } from "@google-cloud/discoveryengine";
import { onStartup } from "../../lib/executionEnvironment";
import { googleRecommendationsCredsPath } from "../../lib/instanceSettings";
import { filterNonnull } from "../../lib/utils/typeGuardUtils";
import { loadByIds } from "../../lib/loaders";
import { accessFilterMultiple } from "../../lib/utils/schemaUtils";
import { getCommandLineArguments } from "../commandLine";
import path from "path";
import { timedFunc } from "../../lib/helpers";

const { RecommendationServiceClient } = v1beta;

onStartup(() => {
  const credsPath = googleRecommendationsCredsPath.get();
  const clArgs = getCommandLineArguments();
  if (credsPath && clArgs.settingsFileName) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(path.dirname(clArgs.settingsFileName), credsPath);
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
  async getRecommendations(limit: number, context: ResolverContext) {
    const client = clients.recommendations();
    const [recommendationsResponse] = await timedFunc('recommend', () => client.recommend({
      validateOnly: false,
      servingConfig: 'projects/lesswrong-recommendations/locations/global/collections/default_collection/dataStores/datastore-lw-recommendations3_1713386634021/servingConfigs/lw-recommendations-5_1713464089330',
      pageSize: limit,
      userEvent: { eventType: 'view-home-page', userPseudoId: context.currentUser?._id }
    }));
    if (!recommendationsResponse.results) {
      // TODO: error?
      // eslint-disable-next-line no-console
      console.log(`Didn't get back a response with any results from google!`);
      return [];
    }

    const postIds = filterNonnull(recommendationsResponse.results.map(result => result.document?.id ?? result.id));
    const posts = filterNonnull(await loadByIds(context, 'Posts', postIds));
    const filteredPosts = await accessFilterMultiple(context.currentUser, context.Posts, posts, context);

    const attributionId = recommendationsResponse.attributionToken;

    const postsWithAttribution = filteredPosts.map(post => ({ post, attributionId }));

    return postsWithAttribution;
  }
};

export { clients, googleVertexApi };
