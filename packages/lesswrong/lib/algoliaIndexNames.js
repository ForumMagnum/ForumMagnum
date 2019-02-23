import { getSetting } from 'meteor/vulcan:core';

const ALGOLIA_PREFIX = getSetting("algolia.indexPrefix", "test_");

export const algoliaIndexNames = {
  Comments: ALGOLIA_PREFIX+'comments',
  Posts: ALGOLIA_PREFIX+'posts',
  Users: ALGOLIA_PREFIX+'users',
  Sequences: ALGOLIA_PREFIX+'sequences',
};
