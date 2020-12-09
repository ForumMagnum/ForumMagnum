import schema from './schema';
import { membersGroup, userCanDo } from '../../vulcan-users/permissions';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { sunshineRegimentGroup } from '../../permissions';

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
membersGroup.can(membersActions);

const sunshineRegimentActions = [
  'reviewVotes.edit.all',
  'reviewVotes.remove.all',
  'reviewVotes.view.all',
];
sunshineRegimentGroup.can(sunshineRegimentActions);

ReviewVotes.checkAccess = async (user: DbUser|null, document: DbReviewVote, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return (
    document.userId === user._id ? userCanDo(user, 'reviewVotes.view.own') : userCanDo(user, `reviewVotes.view.all`)
  )
};

export default ReviewVotes;
