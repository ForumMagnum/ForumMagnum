import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';
import { makeEditable } from "../../editor/make_editable";
import { userCanDo, userOwns } from '@/lib/vulcan-users/permissions';
import { Posts } from '../posts';

const options: MutationOptions<DbJargonTerm> = {  
  editCheck: async (user: DbUser|null, document: DbJargonTerm|null) => {
    if (!user || !document) return false;
    const post = await Posts.findOne({_id: document?.postId})

    if (!post) return false;
    return userOwns(user, post);
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
    order: 20
  }
})

export default JargonTerms;
