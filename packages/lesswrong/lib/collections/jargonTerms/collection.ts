import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import {makeEditable} from "../../editor/make_editable";

export const JargonTerms: JargonTermsCollection = createCollection({
  collectionName: 'JargonTerms',
  typeName: 'JargonTerm',
  schema,
  resolvers: getDefaultResolvers('JargonTerms'),
  mutations: getDefaultMutations('JargonTerms'),
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
