import { createCollection } from '../../vulcan-lib';
import schema from './schema';
import Users from '../users/collection';
import Sequences from '../sequences/collection';
import { makeEditable } from '../../editor/make_editable';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

const options = {
  newCheck: (user: DbUser|null, document: DbChapter|null) => {
    if (!user || !document) return false;
    let parentSequence = Sequences.findOne({_id: document.sequenceId});
    if (!parentSequence) return false
    return Users.owns(user, parentSequence) ? Users.canDo(user, 'chapters.new.own') : Users.canDo(user, `chapters.new.all`)
  },

  editCheck: (user: DbUser|null, document: DbChapter|null) => {
    if (!user || !document) return false;
    let parentSequence = Sequences.findOne({_id: document.sequenceId});
    if (!parentSequence) return false
    return Users.owns(user, parentSequence) ? Users.canDo(user, 'chapters.edit.own') : Users.canDo(user, `chapters.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbChapter|null) => {
    if (!user || !document) return false;
    let parentSequence = Sequences.findOne({_id: document.sequenceId});
    if (!parentSequence) return false
    return Users.owns(user, parentSequence) ? Users.canDo(user, 'chapters.remove.own') : Users.canDo(user, `chapters.remove.all`)
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
