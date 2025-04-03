import { createCollection } from '@/lib/vulcan-lib/collections';
import { userOwns, userCanDo } from '@/lib/vulcan-users/permissions';
import Sequences from '../sequences/collection';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

const options: MutationOptions<DbChapter> = {
  newCheck: async (user: DbUser|null, document: DbChapter|null) => {
    if (!user || !document) return false;
    let parentSequence = await Sequences.findOne({_id: document.sequenceId});
    if (!parentSequence) return false
    return userOwns(user, parentSequence) ? userCanDo(user, 'chapters.new.own') : userCanDo(user, `chapters.new.all`)
  },

  editCheck: async (user: DbUser|null, document: DbChapter|null) => {
    if (!user || !document) return false;
    let parentSequence = await Sequences.findOne({_id: document.sequenceId});
    if (!parentSequence) return false
    return userOwns(user, parentSequence) ? userCanDo(user, 'chapters.edit.own') : userCanDo(user, `chapters.edit.all`)
  },

  removeCheck: async (user: DbUser|null, document: DbChapter|null) => {
    if (!user || !document) return false;
    let parentSequence = await Sequences.findOne({_id: document.sequenceId});
    if (!parentSequence) return false
    return userOwns(user, parentSequence) ? userCanDo(user, 'chapters.remove.own') : userCanDo(user, `chapters.remove.all`)
  },
}

export const Chapters: ChaptersCollection = createCollection({
  collectionName: 'Chapters',
  typeName: 'Chapter',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Chapters', { sequenceId: 1, number: 1 })
    return indexSet;
  },
  resolvers: getDefaultResolvers('Chapters'),
  mutations: getDefaultMutations('Chapters', options),
  logChanges: true,
})

export default Chapters;
