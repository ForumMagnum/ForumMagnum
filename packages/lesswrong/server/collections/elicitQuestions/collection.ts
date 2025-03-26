import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions.ts';
import { createCollection } from "@/lib/vulcan-lib/collections";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";

export const ElicitQuestions: ElicitQuestionsCollection = createCollection({
  collectionName: 'ElicitQuestions',
  typeName: 'ElicitQuestion',
    resolvers: getDefaultResolvers('ElicitQuestions'),
  mutations: getDefaultMutations('ElicitQuestions', {
    newCheck: (user: DbUser|null) => {
      if (!user) return false;
      if (user.deleted) return false;
      return true;
    },
    editCheck: (user: DbUser|null, _document: DbElicitQuestion|null) => {
      return userIsAdminOrMod(user);
    },
    removeCheck: (user: DbUser|null, _document: DbElicitQuestion|null) => {
      return userIsAdminOrMod(user);
    },
  }),
  logChanges: true,
});


export default ElicitQuestions;
