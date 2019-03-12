import schema from './schema.js';
import { createCollection, getDefaultResolvers } from 'meteor/vulcan:core';
import { extractVersionsFromSemver } from '../../editor/utils'
import { addUniversalFields } from '../../collectionUtils'

export const Revisions = createCollection({
  collectionName: 'Revisions',
  typeName: 'Revision',
  schema,
  resolvers: getDefaultResolvers('Revisions'),
  // mutations: getDefaultMutations('Revisions'),
});
addUniversalFields({collection: Revisions})

// Note, since we want to make sure checkAccess is a performant function, we can only check the 
// userId of the current revision for ownership. If the userId of the document the revision is on,
// and the revision itself differ (e.g. because an admin has made the edit, or a coauthor), then
// we will hide those revisions unless they are marked as post-1.0.0 releases. This is not ideal, but
// seems acceptable
Revisions.checkAccess = function (user, revision) {
  if ((user && user._id) === revision.userId) return true
  const { major } = extractVersionsFromSemver(revision.version)
  return major > 0
}

export default Revisions;
