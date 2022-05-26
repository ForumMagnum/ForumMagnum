import { getAlgoliaAdminClient, algoliaSetIndexSettingsAndWait } from '../search/utils';
import { getAlgoliaIndexName } from '../../lib/algoliaUtil';
import { Vulcan } from '../../lib/vulcan-lib';
import { forumTypeSetting } from '../../lib/instanceSettings';

export const algoliaConfigureIndexes = async () => {
  let client = getAlgoliaAdminClient();
  if (!client) {
    console.error("Could not get Algolia admin client."); //eslint-disable-line no-console
    return;
  }
  
  const isEAForum = forumTypeSetting.get() === 'EAForum'
  
  console.log("Configuring Algolia indexes"); //eslint-disable-line no-console
  
  let commentsIndex = client.initIndex(getAlgoliaIndexName("Comments"));
  let postsIndex = client.initIndex(getAlgoliaIndexName("Posts"));
  let usersIndex = client.initIndex(getAlgoliaIndexName("Users"));
  let sequencesIndex = client.initIndex(getAlgoliaIndexName("Sequences"));
  let tagsIndex = client.initIndex(getAlgoliaIndexName("Tags"));
  
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
    advancedSyntax: true
  });
  
  const eaForumPostsSearchableAttrs = [
    'title',
    'unordered(authorDisplayName)',
    'body',
    'unordered(_id)',
  ]
  await algoliaSetIndexSettingsAndWait(postsIndex, {
    searchableAttributes: isEAForum ? eaForumPostsSearchableAttrs : [
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
      'tags'
    ],
    attributesToHighlight: ['title'],
    attributesToSnippet: ['body:10'],
    unretrievableAttributes: [
      'authorUserName',
      'userIP',
    ],
    distinct: true,
    attributeForDistinct: '_id',
    advancedSyntax: true,
  });
  
  const eaForumUsersSearchableAttrs = [
    'unordered(displayName)',
    'unordered(_id)',
    'bio',
    'unordered(mapLocationAddress)',
    'jobTitle',
    'organization',
    'howICanHelpOthers',
    'howOthersCanHelpMe'
  ]
  const eaForumUsersRanking = [
    'typo','geo','words','filters','proximity','attribute','exact',
    'desc(karma)',
    'desc(createdAt)'
  ]
  await algoliaSetIndexSettingsAndWait(usersIndex, {
    searchableAttributes: isEAForum ? eaForumUsersSearchableAttrs : [
      'unordered(displayName)',
      'unordered(_id)',
    ],
    ranking: isEAForum ? eaForumUsersRanking : [
      'desc(karma)',
      'typo','geo','words','filters','proximity','attribute','exact',
      'desc(createdAt)'
    ],
    attributesForFaceting: [
      'filterOnly(af)',
    ],
    advancedSyntax: true
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
    advancedSyntax: true,
    attributesToSnippet: ['description:10'],

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
    advancedSyntax: true
  });
  
  console.log("Done"); //eslint-disable-line no-console
};

Vulcan.algoliaConfigureIndexes = algoliaConfigureIndexes;
