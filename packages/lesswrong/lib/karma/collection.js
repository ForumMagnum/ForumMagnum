import schema from './schema.js';
import mutations from './mutations.js';
import resolvers from './resolvers.js';
import { createCollection } from 'meteor/vulcan:core';

/**
 * @summary The global namespace for Votes.
 * @namespace Votes
 */
 const Votes = createCollection({

   collectionName: 'Votes',

   typeName: 'Vote',

   schema,

   resolvers,

   mutations,

 });

/**
* @summary Vote types
* @type {Object}
*/
Votes.types = [
   {
     value: 1,
     label: 'upvote'
   },
   {
     value: 2,
     label: 'downvote'
   }
 ];

Votes.config = {};
Votes.config.TYPE_UPVOTE = 1;
Votes.config.TYPE_DOWNVOTE = 2;

export default Votes;
