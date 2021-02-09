import { createCollection } from '../../vulcan-lib';
import schema from './schema';
import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import Sequences from '../sequences/collection';
import { makeEditable } from '../../editor/make_editable';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';

const options: MutationOptions<DbChapter> = {
  newCheck: (user: DbUser|null, document: DbChapter|null) => {
    if (!user || !document) return false;
    let parentSequence = Sequences.findOne({_id: document.sequenceId});
    if (!parentSequence) return false
    return userOwns(user, parentSequence) ? userCanDo(user, 'chapters.new.own') : userCanDo(user, `chapters.new.all`)
  },

  editCheck: (user: DbUser|null, document: DbChapter|null) => {
    if (!user || !document) return false;
    let parentSequence = Sequences.findOne({_id: document.sequenceId});
    if (!parentSequence) return false
    return userOwns(user, parentSequence) ? userCanDo(user, 'chapters.edit.own') : userCanDo(user, `chapters.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbChapter|null) => {
    if (!user || !document) return false;
    let parentSequence = Sequences.findOne({_id: document.sequenceId});
    if (!parentSequence) return false
    return userOwns(user, parentSequence) ? userCanDo(user, 'chapters.remove.own') : userCanDo(user, `chapters.remove.all`)
  },
}

export const Chapters: ChaptersCollection = createCollection({
  collectionName: 'Chapters',
  typeName: 'Chapter',
  schema,
  resolvers: getDefaultResolvers('Chapters'),
  mutations: getDefaultMutations('Chapters', options),
})

export const makeEditableOptions = {
  order: 30,
  getLocalStorageId: (chapter, name) => {
    if (chapter._id) { return {id: `${chapter._id}_${name}`, verify: true} }
    return {id: `sequence: ${chapter.sequenceId}_${name}`, verify: false}
  },
}

makeEditable({
  collection: Chapters,
  options: makeEditableOptions
})
addUniversalFields({collection: Chapters})

export default Chapters;
