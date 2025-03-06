import { createCollection } from '@/lib/vulcan-lib/collections';
import { userCanDo, userOwns } from '@/lib/vulcan-users/permissions';
import schema from '@/lib/collections/sequences/schema';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { addUniversalFields } from "@/lib/collectionUtils";
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

const options: MutationOptions<DbSequence> = {
  newCheck: (user: DbUser|null, document: DbSequence|null) => {
    if (!user || !document) return false;
    // Either the document is unowned (and will be filled in with the userId
    // later), or the user owns the document, or the user is an admin
    return (!document.userId || userOwns(user, document)) ?
      userCanDo(user, 'sequences.new.own') :
      userCanDo(user, `sequences.new.all`)
  },

  editCheck: (user: DbUser|null, document: DbSequence|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'sequences.edit.own') : userCanDo(user, `sequences.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbSequence|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'sequences.edit.own') : userCanDo(user, `sequences.edit.all`)
  },
}

function augmentForDefaultView(indexFields: MongoIndexKeyObj<DbSequence>): MongoIndexKeyObj<DbSequence> {
  return { hidden:1, af:1, isDeleted:1, ...indexFields };
}

export const Sequences = createCollection({
  collectionName: 'Sequences',
  typeName: 'Sequence',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Sequences', augmentForDefaultView({ userId:1, userProfileOrder: -1 }));
    indexSet.addIndex('Sequences', augmentForDefaultView({ userId: 1, draft: 1, hideFromAuthorPage: 1, userProfileOrder: 1 }))
    indexSet.addIndex('Sequences', augmentForDefaultView({ curatedOrder:-1 }));
    return indexSet;
  },
  resolvers: getDefaultResolvers('Sequences'),
  mutations: getDefaultMutations('Sequences', options),
  logChanges: true,
})

addUniversalFields({collection: Sequences})

Sequences.checkAccess = async (user, document) => {
  if (!document || document.isDeleted) {
    return false;
  }
  
  // If it isn't a draft, it's public
  if (!document.draft) {
    return true;
  }
  
  if (!user) {
    return false;
  }
  
  if (userOwns(user, document)) {
    return true;
  } else if (userCanDo(user, `sequences.view.all`)) {
    return true;
  } else {
    return false;
  }
}

export default Sequences;
