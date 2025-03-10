import { createCollection } from '../../vulcan-lib/collections';
import schema from './schema';
import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import Sequences from '../sequences/collection';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
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
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Chapters', { sequenceId: 1, number: 1 })
    return indexSet;
  },
  resolvers: getDefaultResolvers('Chapters'),
  mutations: getDefaultMutations('Chapters', options),
  logChanges: true,
})

Chapters.checkAccess = async (user: DbUser|null, document: DbChapter, context: ResolverContext|null): Promise<boolean> => {
  if (!document) return false;
  // Since chapters have no userIds there is no obvious way to check for permissions.
  // We might want to check the parent sequence, but that seems too costly, so for now just be permissinve
  return true
};

export default Chapters;
