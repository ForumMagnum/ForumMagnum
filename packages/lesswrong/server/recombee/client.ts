import { ApiClient, requests } from 'recombee-api-client';
import { RecombeeAlgorithm } from '../../lib/collections/users/recommendationSettings';
import { accessFilterMultiple } from '../../lib/utils/schemaUtils';
import { loadByIds } from '../../lib/loaders';
import { recombeeDatabaseIdSetting, recombeePrivateApiTokenSetting } from '../databaseSettings';
import { userIsAdmin } from '../../lib/vulcan-users';
import { filterNonnull } from '../../lib/utils/typeGuardUtils';

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
    const { count, lwRationalityOnly, adminOverrides } = lwAlgoSettings;

    const returnPostCount = adminOverrides?.count ?? count;

    // let userId = currentUser._id;
    let scenario = 'recommendations-personal';
    if (userIsAdmin(currentUser) && adminOverrides) {
      userId = adminOverrides.userId ?? currentUser._id;
      // Explicitly coalesce empty strings to the default scenario
      scenario = adminOverrides.scenario || scenario;
    }

    const adjustedCount = Math.round(returnPostCount * 1.5);
    // TODO: pass in scenario, exclude unread, etc, in options?
    const lwRationalityFilter = lwRationalityOnly ? ` and ("Rationality" in 'core_tags' or "World Modeling" in 'core_tags')` : '';
    const filter = `'karma' >= 50${lwRationalityFilter}`;

    console.log({ userId: currentUser?._id, overrides: lwAlgoSettings.adminOverrides });
    const request = new requests.RecommendItemsToUser(userId, adjustedCount, {
      ...adminOverrides,
      scenario,
      filter,
      // rotationRate: .2,
    });

    const response = await client.send(request);
    console.log({ response });

    const postIds = response.recomms.map(rec => rec.id);
    const posts = await loadByIds(context, 'Posts', postIds);
    // TODO: also filter out already-read posts if algo settings require it
    // const filteredPosts = await accessFilterMultiple(currentUser, Posts, posts, context);


    // TODO: loop over the above if we don't get enough posts?
    return filterNonnull(posts).slice(0, returnPostCount);
  }
};

export { recombeeApi };
