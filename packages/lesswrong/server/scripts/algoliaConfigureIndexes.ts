import { getAlgoliaAdminClient, algoliaSetIndexSettingsAndWait } from '../search/utils';
import { getAlgoliaIndexName } from '../../lib/search/algoliaUtil';
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
      'publicDateMs',
      'searchable(tags)',
    ],
    attributesToHighlight: ['authorDisplayName'],
    attributesToSnippet: isEAForum ? ['body:30'] : ['body:20'],
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
    ranking: ['typo','geo','words','filters','proximity','attribute','exact','custom'],
    customRanking: [
      'asc(order)',
      'desc(baseScore)',
      'desc(score)'
    ],
    attributesForFaceting: [
      'af',
      'searchable(authorDisplayName)',
      'authorSlug',
      'postedAt',
      'publicDateMs',
      'searchable(tags)',
      'curated',
      'isEvent'
    ],
    attributesToHighlight: ['title'],
    attributesToSnippet: isEAForum ? ['body:20'] : ['body:10'],
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
    'howOthersCanHelpMe',
    'firstName',
    'lastName',
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
      'typo','geo','words','filters','proximity','attribute','exact',
      'desc(karma)',
      'desc(createdAt)'
    ],
    attributesForFaceting: [
      'filterOnly(af)',
      'searchable(tags)',
      'publicDateMs',
    ],
    attributesToSnippet: ['bio:20'],
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
      'publicDateMs',
    ],
    advancedSyntax: true,
    attributesToSnippet: ['plaintextDescription:20'],

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
    attributesForFaceting: [
      'filterOnly(wikiOnly)',
      'filterOnly(isSubforum)', // DEPRECATED: remove once isSubforum -> core filter change is deployed
      'filterOnly(core)',
    ],
    distinct: false,
    attributesToSnippet: isEAForum ? ['description:20'] : ['description:10'],
    advancedSyntax: true
  });
  
  console.log("Done"); //eslint-disable-line no-console
};

Vulcan.algoliaConfigureIndexes = algoliaConfigureIndexes;
