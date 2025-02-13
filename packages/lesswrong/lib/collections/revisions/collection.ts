import schema from './schema';
import { createCollection, getCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultMutations, getDefaultResolvers } from '../../collectionUtils'
import { userCanDo, membersGroup } from '../../vulcan-users/permissions';
import { extractVersionsFromSemver } from '../../editor/utils';
import { makeVoteable } from '../../make_voteable';
import { getCollaborativeEditorAccess, accessLevelCan } from '../posts/collabEditingPermissions';
import { postCheckAccess } from '../posts/checkAccess';

export const PLAINTEXT_HTML_TRUNCATION_LENGTH = 4000
export const PLAINTEXT_DESCRIPTION_LENGTH = 2000

export const Revisions: RevisionsCollection = createCollection({
  collectionName: 'Revisions',
  typeName: 'Revision',
  schema,
  resolvers: getDefaultResolvers('Revisions'),
  // This has mutators because of a few mutable metadata fields (eg
  // skipAttributions), but most parts of revisions are create-only immutable.
  mutations: getDefaultMutations('Revisions', {
    create: false ,update: true, upsert: false, delete: false,
    editCheck: (user: DbUser|null) => {
      return userIsAdminOrMode(user);
    }
  }),
  logChanges: true,
});
addUniversalFields({
  collection: Revisions,
  legacyDataOptions: {
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
  }
})

// Note, since we want to make sure checkAccess is a performant function, we can only check the 
// userId of the current revision for ownership. If the userId of the document the revision is on,
// and the revision itself differ (e.g. because an admin has made the edit, or a coauthor), then
// we will hide those revisions unless they are marked as post-1.0.0 releases. This is not ideal, but
// seems acceptable
Revisions.checkAccess = async (user: DbUser|null, revision: DbRevision, context: ResolverContext|null): Promise<boolean> => {
  if (!revision) return false
  if ((user && user._id) === revision.userId) return true
  if (userCanDo(user, 'posts.view.all')) return true
  
  // not sure why some revisions have no collectionName,
  // but this will cause an error below so just exclude them
  if (!revision.collectionName) return false

  const collectionName = revision.collectionName;
  if (collectionName === "CurationNotices") return false

  // Get the document that this revision is a field of, and check for access to
  // it. This is necessary for correctly handling things like posts' draft
  // status and sharing settings.
  //
  // We might or might not have a ResolverContext (because some places, like
  // email-sending, don't have one). If we do, use its loader; in the typical
  // case, this will hit in the cache 100% of the time. If we don't have a
  // ResolverContext, use a findOne query; this is slow, but doesn't come up
  // in any contexts where speed matters.
  const { major: majorVersion } = extractVersionsFromSemver(revision.version)
  const collection: CollectionBase<CollectionNameString> = getCollection(collectionName);
  const documentId = revision.documentId;

  if (!documentId) {
    return false
  }
  
  const document = context
    ? await context.loaders[collectionName].load(documentId)
    : await collection.findOne(documentId);

  // This shouldn't happen, but `collection.findOne` has a type signature that returns null, and technically we don't enforce data consistency such that it's strictly impossible
  if (!document) {
    return false;
  }
  
  if (revision.collectionName === "Posts") {
    const collabEditorAccess = await getCollaborativeEditorAccess({
      formType: "edit",
      post: document as DbPost,
      user: user,
      useAdminPowers: true,
      context
    });
    if (accessLevelCan(collabEditorAccess, "read")) {
      return true;
    }
  }

  // JargonTerms are often created by an admin bot account, and by default would not be visible to post authors
  // so we need to check read access to the post itself
  if (collectionName === "JargonTerms") {
    const postId = (document as DbJargonTerm).postId;
    const post = context
      ? await context.loaders.Posts.load(postId)
      // Avoid import cycle
      : await getCollection("Posts").findOne(postId);

    if (!post) {
      return false;
    }

    return await postCheckAccess(user, post, context);
  }
  
  
  if (revision.draft) {
    return false;
  }
  
  // Everyone who can see the post can get access to non-draft revisions
  if (!document || (collection.checkAccess && !(await collection.checkAccess(user, document, context)))) {
    return false;
  }
  
  return true;
}

export interface ChangeMetrics {
  added: number
  removed: number
}

makeVoteable(Revisions, {
  timeDecayScoresCronjob: false,
});

membersGroup.can([
  'revisions.smallDownvote',
  'revisions.bigDownvote',
  'revisions.smallUpvote',
  'revisions.bigUpvote',
]);

export default Revisions;
