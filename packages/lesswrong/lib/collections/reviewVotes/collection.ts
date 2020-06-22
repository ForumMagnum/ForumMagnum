import schema from './schema';
import Users from '../users/collection';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'

export const ReviewVotes: ReviewVotesCollection = createCollection({
  collectionName: 'ReviewVotes',
  typeName: 'ReviewVote',
  schema,
  resolvers: getDefaultResolvers('ReviewVotes'),
});

addUniversalFields({collection: ReviewVotes})

const membersActions = [
  'reviewVotes.new',
  'reviewVotes.view.own',
];
Users.groups.members.can(membersActions);

const sunshineRegimentActions = [
  'reviewVotes.edit.all',
  'reviewVotes.remove.all',
  'reviewVotes.view.all',
];
Users.groups.sunshineRegiment.can(sunshineRegimentActions);

ReviewVotes.checkAccess = async (user: DbUser|null, document: DbReviewVote, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return (
    document.userId === user._id ? Users.canDo(user, 'reviewVotes.view.own') : Users.canDo(user, `reviewVotes.view.all`)
  )
};

export default ReviewVotes;
