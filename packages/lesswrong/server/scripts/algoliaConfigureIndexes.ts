import { getAlgoliaAdminClient, algoliaSetIndexSettingsAndWait } from '../search/utils';
import {
  algoliaCollectionIsCustomSortable,
  AlgoliaIndexCollectionName,
  algoliaIndexedCollectionNames,
  getAlgoliaIndexName,
  getAlgoliaReplicasForCollection,
} from '../../lib/algoliaUtil';
import { Vulcan } from '../../lib/vulcan-lib';
import { isEAForum } from '../../lib/instanceSettings';
import type { Index, IndexSettings } from 'algoliasearch';

const algoliaIndexSettings: Record<AlgoliaIndexCollectionName, IndexSettings> = {
  Comments: {
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
  },
  Posts: {
    searchableAttributes: isEAForum
      ? [
        'title',
        'unordered(authorDisplayName)',
        'body',
        'unordered(_id)',
      ]
      : [
        'title',
        'body',
        'unordered(authorDisplayName)',
        'unordered(_id)',
      ],
    ranking: [
      'typo', 'geo', 'words', 'filters', 'proximity', 'attribute', 'exact', 'custom',
    ],
    customRanking: [
      'asc(order)',
      'desc(baseScore)',
      'desc(score)',
    ],
    attributesForFaceting: [
      'af',
      'searchable(authorDisplayName)',
      'authorSlug',
      'postedAt',
      'publicDateMs',
      'searchable(tags)',
      'curated',
      'isEvent',
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
  },
  Users: {
    searchableAttributes: isEAForum
    ? [
      'unordered(displayName)',
      'unordered(_id)',
      'bio',
      'unordered(mapLocationAddress)',
      'jobTitle',
      'organization',
      'howICanHelpOthers',
      'howOthersCanHelpMe',
    ]
    : [
        'unordered(displayName)',
        'unordered(_id)',
      ],
    ranking: isEAForum
      ? [
        'typo','geo','words','filters','proximity','attribute','exact',
        'desc(karma)',
        'desc(createdAt)',
      ] : [
        'desc(karma)',
        'typo','geo','words','filters','proximity','attribute','exact',
        'desc(createdAt)',
      ],
    attributesForFaceting: [
      'filterOnly(af)',
      'searchable(tags)',
      'publicDateMs',
    ],
    attributesToSnippet: ['bio:20'],
    advancedSyntax: true
  },
  Sequences: {
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
  },
  Tags: {
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
    advancedSyntax: true,
  },
};

export const algoliaConfigureIndexes = async () => {
  let client = getAlgoliaAdminClient();
  if (!client) {
    console.error("Could not get Algolia admin client."); //eslint-disable-line no-console
    return;
  }

  console.log("Configuring Algolia indexes"); //eslint-disable-line no-console

  for (const collectionName of algoliaIndexedCollectionNames) {
    console.log(`...Configuring ${collectionName}`); //eslint-disable-line no-console
    const index = client.initIndex(getAlgoliaIndexName(collectionName));

    const replicas = isEAForum
      ? getAlgoliaReplicasForCollection(collectionName)
      : [];
    const settings = algoliaIndexSettings[collectionName];
    await algoliaSetIndexSettingsAndWait(index, {
      ...settings,
      replicas: replicas.map((replica) => replica.indexName),
    });

    for (const {indexName, rankings} of replicas) {
      console.log(`......Replica ${indexName}`); //eslint-disable-line no-console
      const replica = client.initIndex(indexName);
      await algoliaSetIndexSettingsAndWait(replica, {
        ...settings,
        ranking: [
          ...rankings,
          ...settings.ranking ?? [],
        ],
      });
    }
  }

  console.log("Done"); //eslint-disable-line no-console
};

Vulcan.algoliaConfigureIndexes = algoliaConfigureIndexes;
