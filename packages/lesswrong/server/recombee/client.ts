import { ApiClient, requests } from 'recombee-api-client';
import { RecombeeConfiguration, RecombeeRecommendationArgs } from '../../lib/collections/users/recommendationSettings';
import { accessFilterMultiple } from '../../lib/utils/schemaUtils';
import { loadByIds } from '../../lib/loaders';
import { recombeeDatabaseIdSetting, recombeePrivateApiTokenSetting } from '../databaseSettings';
import { userIsAdmin } from '../../lib/vulcan-users';
import { filterNonnull } from '../../lib/utils/typeGuardUtils';
import { htmlToTextDefault } from '../../lib/htmlToText';
import { truncate } from '../../lib/editor/ellipsize';
import findByIds from '../vulcan-lib/findbyids';

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
  async getRecommendationsForUser(userId: string, count: number, lwAlgoSettings: RecombeeRecommendationArgs, context: ResolverContext) {
    const client = getRecombeeClientOrThrow();
    const { userId: overrideUserId, lwRationalityOnly, onlyUnread, ...settings } = lwAlgoSettings;

    const returnPostCount = count;
    const servedUserId = overrideUserId ?? userId;

    const adjustedCount = Math.round(returnPostCount * 1.0);
    // TODO: pass in scenario, exclude unread, etc, in options?
    const lwRationalityFilter = lwRationalityOnly ? ` and ("Rationality" in 'core_tags' or "World Modeling" in 'core_tags')` : '';

    const request = new requests.RecommendItemsToUser(servedUserId, adjustedCount, {
      ...settings,
      booster: settings.booster || undefined,
      rotationTime: settings.rotationTime * 3600,
    });

    const response = await client.send(request);
    const postIds = response.recomms.map(rec => rec.id);
    const posts = await loadByIds(context, 'Posts', postIds);

    // TODO: loop over the above if we don't get enough posts?
    return filterNonnull(posts).slice(0, returnPostCount);
  },

  async upsertPost(post: DbPost, context: ResolverContext) {
    const client = getRecombeeClientOrThrow();

    const { Tags } = context;

    const tagIds = Object.entries(post.tagRelevance).filter(([_, relevance]: [string, number]) => relevance > 0).map(([tagId]: [string, number]) => tagId)
    const tags = filterNonnull(await findByIds(Tags, tagIds))
    const tagNames = tags.map(tag => tag.name)
    const coreTagNames = tags.filter(tag => tag.core).map(tag => tag.name)

    const postText = htmlToTextDefault(truncate(post.contents.html, 2000, 'words'))

    const request = new requests.SetItemValues(post._id, {
      title: post.title,
      author: post.author,
      authorId: post.userId,
      karma: post.baseScore,
      body: postText,
      postedAt: post.postedAt,
      tags: tagNames,
      coreTags: coreTagNames,
      curated: !!post.curatedDate,
      frontpage: !!post.frontpageDate,
      draft: !!post.draft,
    }, { cascadeCreate: true });

    await client.send(request);
  }
};

export { recombeeApi };
