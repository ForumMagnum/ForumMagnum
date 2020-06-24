import { createCollection } from '../../vulcan-lib';
import Users from '../users/collection';
import schema from './schema';
import { makeEditable } from '../../editor/make_editable';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

const options = {
  newCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'sequences.new.own') : Users.canDo(user, `sequences.new.all`)
  },

  editCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'sequences.edit.own') : Users.canDo(user, `sequences.edit.all`)
  },

  removeCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'sequences.edit.own') : Users.canDo(user, `sequences.edit.all`)
  },
}

interface ExtendedSequencesCollection extends SequencesCollection {
  // Functions in lib/collections/sequences/elpers.ts
  getPageUrl: any
  getAllPostIDs: (sequenceId: string) => Promise<Array<string>>
  getAllPosts: (sequenceId: string) => Promise<Array<DbPost>>
  getNextPostID: (sequenceId: string, postId: string) => Promise<string|null>
  getPrevPostID: (sequenceId: string, postId: string) => Promise<string|null>
  sequenceContainsPost: (sequenceId: string, postId: string) => Promise<boolean>
  
  // Functions in search/utils.ts
  toAlgolia: (sequence: DbSequence) => Promise<Array<Record<string,any>>|null>
}

export const Sequences: ExtendedSequencesCollection = createCollection({
  collectionName: 'Sequences',
  typeName: 'Sequence',
  schema,
  resolvers: getDefaultResolvers('Sequences'),
  mutations: getDefaultMutations('Sequences', options)
})

export const makeEditableOptions = {
  order: 20
}

makeEditable({
  collection: Sequences,
  options: makeEditableOptions
})
addUniversalFields({collection: Sequences})

export default Sequences;
