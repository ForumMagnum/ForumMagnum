import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { userIsAdmin, userOwns } from '@/lib/vulcan-users/permissions';
import { userCanCreateAndEditJargonTerms } from '@/lib/betas';
import { userIsPostCoauthor } from '@/lib/collections/posts/helpers';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

function userHasJargonTermPostPermission(user: DbUser | null, post: DbPost) {
  return userIsAdmin(user) || userOwns(user, post) || userIsPostCoauthor(user, post);
}

// TODO: come back to this to see if there are any other posts which can't have jargon terms
function postCanHaveJargonTerms(post: DbPost) {
  return !post.isEvent;
}

async function userCanCreateJargonTermForPost(user: DbUser | null, jargonTerm: DbJargonTerm | DbInsertion<DbJargonTerm> | null, context: ResolverContext) {
  const { Posts } = context;

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
  newCheck: (user, jargonTerm, context) => {
    return userCanCreateJargonTermForPost(user, jargonTerm, context);
  },
  editCheck: (user, jargonTerm, context) => {
    return userCanCreateJargonTermForPost(user, jargonTerm, context);
  },
  removeCheck: () => {
    return false;
  },
}

export const JargonTerms: JargonTermsCollection = createCollection({
  collectionName: 'JargonTerms',
  typeName: 'JargonTerm',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('JargonTerms', { postId: 1, term: 1, createdAt: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('JargonTerms'),
  mutations: getDefaultMutations('JargonTerms', options),
  logChanges: true,
});

export default JargonTerms;
