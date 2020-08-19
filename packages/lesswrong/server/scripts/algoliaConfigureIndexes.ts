import { getAlgoliaAdminClient, algoliaSetIndexSettingsAndWait } from '../search/utils';
import { algoliaIndexNames } from '../../lib/algoliaUtil';
import { Vulcan } from '../../lib/vulcan-lib';

export const algoliaConfigureIndexes = async () => {
  let client = getAlgoliaAdminClient();
  if (!client) {
    console.error("Could not get Algolia admin client."); //eslint-disable-line no-console
    return;
  }
  
  console.log("Configuring Algolia indexes"); //eslint-disable-line no-console
  
  let commentsIndex = client.initIndex(algoliaIndexNames.Comments);
  let postsIndex = client.initIndex(algoliaIndexNames.Posts);
  let usersIndex = client.initIndex(algoliaIndexNames.Users);
  let sequencesIndex = client.initIndex(algoliaIndexNames.Sequences);
  let tagsIndex = client.initIndex(algoliaIndexNames.Tags);
  
  await algoliaSetIndexSettingsAndWait(commentsIndex, {
    searchableAttributes: [
      'body',
      'unordered(authorDisplayName)',
      'unordered(_id)',
    ],
    ranking: [
      'typo','geo','words','filters','proximity','attribute','exact',
      'desc(baseScore)'
    ],
    attributesForFaceting: [
      'filterOnly(af)',
      'postedAt',
    ],
    attributesToHighlight: ['authorDisplayName'],
    attributesToSnippet: ['body:20'],
    unretrievableAttributes: ['authorUserName'],
  });
  await algoliaSetIndexSettingsAndWait(postsIndex, {
    searchableAttributes: [
      'title',
      'body',
      'unordered(authorDisplayName)',
      'unordered(_id)',
    ],
    ranking: ['typo','geo','words','filters','exact','proximity','attribute','custom'],
    customRanking: [
      'desc(baseScore)',
      'desc(score)'
    ],
    attributesForFaceting: [
      'af',
      'searchable(authorDisplayName)',
      'authorSlug',
      'postedAt',
    ],
    attributesToHighlight: ['title'],
    attributesToSnippet: ['body:20'],
    unretrievableAttributes: [
      'authorUserName',
      'userIP',
    ],
    distinct: true,
    attributeForDistinct: '_id',
    advancedSyntax: true,
  });
  await algoliaSetIndexSettingsAndWait(usersIndex, {
    searchableAttributes: [
      'unordered(displayName)',
      'bio',
      'unordered(_id)',
    ],
    ranking: [
      'desc(karma)',
      'typo','geo','words','filters','proximity','attribute','exact',
      'desc(createdAt)'
    ],
    attributesForFaceting: [
      'filterOnly(af)',
    ],
  });
  await algoliaSetIndexSettingsAndWait(sequencesIndex, {
    searchableAttributes: [
      'title',
      'plaintextDescription',
      'unordered(authorDisplayName)',
      'unordered(_id)',
    ],
    attributesForFaceting: [
      'filterOnly(af)',
    ],
  });
  await algoliaSetIndexSettingsAndWait(tagsIndex, {
    searchableAttributes: [
      'name',
      'description',
      'unordered(_id)',
    ],
    ranking: [
      'typo','geo','words','filters','proximity','attribute','exact',
      'desc(core)',
      'desc(postCount)',
    ],
    distinct: false,
    attributesToSnippet: ['description:10'],
  });
  
  console.log("Done"); //eslint-disable-line no-console
};

Vulcan.algoliaConfigureIndexes = algoliaConfigureIndexes;
