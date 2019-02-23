import { getSetting } from 'meteor/vulcan:core';
import { Posts } from './collections/posts';
import { Comments } from './collections/comments'
import Users from 'meteor/vulcan:users';
import Sequences from './collections/sequences/collection.js';

const ALGOLIA_PREFIX = getSetting("algolia.indexPrefix", "test_");

Comments.algoliaIndexName = ALGOLIA_PREFIX+'comments';
Posts.algoliaIndexName = ALGOLIA_PREFIX+'posts';
Users.algoliaIndexName = ALGOLIA_PREFIX+'users';
Sequences.algoliaIndexName = ALGOLIA_PREFIX+'sequences';
