import { createCollection } from '../../vulcan-lib';
import schema from './schema';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { forumTypeSetting } from '../../instanceSettings';

export const Votes: VotesCollection = createCollection({
  collectionName: 'Votes',
  typeName: 'Vote',
  collectionType: forumTypeSetting.get() === 'EAForum' ? 'pg' : 'mongo',
  schema,
  resolvers: getDefaultResolvers('Votes'),
});

addUniversalFields({collection: Votes})

export default Votes;
