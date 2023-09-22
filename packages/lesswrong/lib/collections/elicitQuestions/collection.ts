import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { getDefaultResolvers } from '../../collectionUtils'

export const ElicitQuestions: ElicitQuestionsCollection = createCollection({
  collectionName: 'ElicitQuestions',
  typeName: 'ElicitQuestion',
  collectionType: 'pg',
  schema,
  resolvers: getDefaultResolvers('ElicitQuestions'),
  logChanges: true,
});

export default ElicitQuestions;
