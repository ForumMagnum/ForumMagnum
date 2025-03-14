import { createCollection } from '@/lib/vulcan-lib/collections';
import { userCanCreateTags } from '@/lib/betas';
import schema from '@/lib/collections/tags/schema';
import { tagUserHasSufficientKarma } from '@/lib/collections/tags/helpers';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';

export const Tags = createCollection({
  collectionName: 'Tags',
  typeName: 'Tag',
  schema,
  resolvers: getDefaultResolvers('Tags'),
  mutations: getDefaultMutations('Tags', {
    newCheck: (user: DbUser|null, tag: DbTag|null) => {
      if (!user) return false;
      if (user.deleted) return false;

      if (!user.isAdmin) {  // skip further checks for admins
        if (!tagUserHasSufficientKarma(user, "new")) return false
      }
      return userCanCreateTags(user);
    },
    editCheck: (user: DbUser|null, tag: DbTag|null) => {
      if (!user) return false;
      if (user.deleted) return false;

      if (!user.isAdmin) {  // skip further checks for admins
        // If canEditUserIds is set only those users can edit the tag
        const restricted = tag && tag.canEditUserIds
        if (restricted && !tag.canEditUserIds?.includes(user._id)) return false;
        if (!restricted && !tagUserHasSufficientKarma(user, "edit")) return false
      }
      return userCanCreateTags(user);
    },
    removeCheck: (user: DbUser|null, tag: DbTag|null) => {
      return false;
    },
  }),
  logChanges: true,
  voteable: {
    timeDecayScoresCronjob: false,
  },
});

export default Tags;
