import { ApiClient, requests } from 'recombee-api-client';
import { RecombeeAlgorithm } from '../../lib/collections/users/recommendationSettings';
import { accessFilterMultiple } from '../../lib/utils/schemaUtils';
import { loadByIds } from '../../lib/loaders';
import { recombeeDatabaseIdSetting, recombeePrivateApiTokenSetting } from '../databaseSettings';

const getRecombeeClientOrThrow = (() => {
  let client: ApiClient;

  return () => {
    if (!client) {
      const databaseId = recombeeDatabaseIdSetting.get();
      const apiToken = recombeePrivateApiTokenSetting.get();

      if (!databaseId || !apiToken) {
        throw new Error('Missing either databaseId or api token when initializing Recombee client!');
      }
      
      // TODO - pull out client options like region to db settings?
      client = new ApiClient(databaseId, apiToken, { region: 'us-west' });
    }

    return client;
  };
})();

const recombeeApi = {
  async getRecommendationsForUser(userId: string, lwAlgoSettings: RecombeeAlgorithm, context: ResolverContext) {
    const client = getRecombeeClientOrThrow();
    const { currentUser, Posts } = context;
    const { count, lwRationalityOnly } = lwAlgoSettings;

    const adjustedCount = count + 5;
    // TODO: pass in scenario, exclude unread, etc, in options?
    const lwRationalityFilter = lwRationalityOnly ? ` and ("Rationality" in 'core_tags' or "World Modeling" in 'core_tags')` : '';
    const filter = `'karma' >= 50${lwRationalityFilter}`;

    const request = new requests.RecommendItemsToUser(userId, adjustedCount, {
      scenario: 'recommendations-section',
      filter,
      rotationRate: .2,
    });

    const response = await client.send(request);
    console.log({ response });

    const postIds = response.recomms.map(rec => rec.id);
    const posts = await loadByIds(context, 'Posts', postIds);
    // TODO: also filter out already-read posts if algo settings require it
    const filteredPosts = await accessFilterMultiple(currentUser, Posts, posts, context);


    // TODO: loop over the above if we don't get enough posts?
    return filteredPosts.slice(0, lwAlgoSettings.count);
  }
};

export { recombeeApi };
