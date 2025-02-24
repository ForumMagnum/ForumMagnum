import schema from './schema';
import { membersGroup, userCanDo } from '../../vulcan-users/permissions';
import { createCollection } from '../../vulcan-lib/collections';
import { sunshineRegimentGroup } from '../../permissions';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

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
