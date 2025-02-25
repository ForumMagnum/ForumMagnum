import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { makeEditable } from "../../editor/make_editable";
import { userIsAdmin, userOwns } from '@/lib/vulcan-users/permissions';
import { Posts } from '../posts/collection';
import { userCanCreateAndEditJargonTerms } from '@/lib/betas';
import { userIsPostCoauthor } from '../posts/helpers';
import { postCheckAccess } from '../posts/checkAccess';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

function userHasJargonTermPostPermission(user: DbUser | null, post: DbPost) {
  return userIsAdmin(user) || userOwns(user, post) || userIsPostCoauthor(user, post);
}

// TODO: come back to this to see if there are any other posts which can't have jargon terms
function postCanHaveJargonTerms(post: DbPost) {
  return !post.isEvent;
}

async function userCanCreateJargonTermForPost(user: DbUser | null, jargonTerm: DbJargonTerm | null) {
  if (!jargonTerm || !userCanCreateAndEditJargonTerms(user)) {
    return false;
  }

  const post = await Posts.findOne({ _id: jargonTerm.postId });
  if (!post || !postCanHaveJargonTerms(post)) {
    return false;
  }

  return userHasJargonTermPostPermission(user, post);
}

const options: MutationOptions<DbJargonTerm> = {
  newCheck: (user, jargonTerm) => {
    return userCanCreateJargonTermForPost(user, jargonTerm);
  },
  editCheck: (user, jargonTerm) => {
    return userCanCreateJargonTermForPost(user, jargonTerm);
  },
  removeCheck: () => {
    return false;
  },
}

export const JargonTerms: JargonTermsCollection = createCollection({
  collectionName: 'JargonTerms',
  typeName: 'JargonTerm',
  schema,
  resolvers: getDefaultResolvers('JargonTerms'),
  mutations: getDefaultMutations('JargonTerms', options),
  logChanges: true,
});

addUniversalFields({collection: JargonTerms});

makeEditable({
  collection: JargonTerms,
  options: {
    commentEditor: true,
    commentStyles: true,
    hideControls: true,
    order: 10,
    hintText: 'If you want to add a custom term, use this form.  The description goes here.  The term, as well as any alt terms, must appear in your post.',
    permissions: {
      canRead: ['guests'],
      canUpdate: ['members'],
      canCreate: ['members'],
    }
  },
});

JargonTerms.checkAccess = async (user: DbUser | null, jargonTerm: DbJargonTerm, context: ResolverContext | null) => {
  const post = context
    ? await context.loaders.Posts.load(jargonTerm.postId)
    : await Posts.findOne(jargonTerm.postId);

  if (!post) {
    return false;
  }

  // If a user has read access to the post, they have read access to any jargon terms for that post
  return await postCheckAccess(user, post, context);
};

export default JargonTerms;
