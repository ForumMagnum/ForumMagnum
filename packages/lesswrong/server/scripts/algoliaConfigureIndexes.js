/* global Vulcan */
import { getAlgoliaAdminClient, algoliaSetIndexSettingsAndWait } from '../search/utils';
import { algoliaIndexNames } from '../../lib/algoliaIndexNames';

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
  
  await algoliaSetIndexSettingsAndWait(commentsIndex, {
    searchableAttributes: [
      'body',
      'unordered(authorDisplayName)',
      'unordered(_id)',
    ],
  });
  await algoliaSetIndexSettingsAndWait(postsIndex, {
    searchableAttributes: [
      'title',
      'body',
      'unordered(authorDisplayName)',
      'unordered(_id)',
    ],
  });
  await algoliaSetIndexSettingsAndWait(usersIndex, {
    searchableAttributes: [
      'unordered(displayName)',
      'bio',
      'unordered(_id)',
    ],
  });
  await algoliaSetIndexSettingsAndWait(sequencesIndex, {
    searchableAttributes: [
      'title',
      'plaintextDescription',
      'unordered(authorDisplayName)',
      'unordered(_id)',
    ],
  });
  
  console.log("Done"); //eslint-disable-line no-console
};

Vulcan.algoliaConfigureIndexes = algoliaConfigureIndexes;
