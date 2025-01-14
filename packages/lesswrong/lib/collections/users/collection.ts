import schema, { createDisplayName } from './schema';
import { createCollection, addGraphQLQuery, addGraphQLResolvers } from '../../vulcan-lib';
import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import { addUniversalFields, getDefaultMutations, getDefaultResolvers } from '../../collectionUtils';
import { makeEditable } from '../../editor/make_editable';
import { formGroups } from './formGroups';
import { isEAForum } from '../../instanceSettings';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { addSlugFields } from '@/lib/utils/schemaUtils';

export const Users = createCollection({
  collectionName: 'Users',
  typeName: 'User',
  schema,
  resolvers: getDefaultResolvers('Users'),
  mutations: getDefaultMutations('Users', {
    editCheck: (user: DbUser|null, document: DbUser) => {
      if (!user || !document)
        return false;
  
      if (userCanDo(user, 'alignment.sidebar'))
        return true
  
      // OpenCRUD backwards compatibility
      return userOwns(user, document)
        ? userCanDo(user, ['user.update.own', 'users.edit.own'])
        : userCanDo(user, ['user.update.all', 'users.edit.all']);
    },
    // Anyone can create users
    newCheck: () => true,
    // Nobody can delete users
    removeCheck: () => false
  }),
  logChanges: true,
  dependencies: [
    {type: "extension", name: "pg_trgm"},
  ],
});

addGraphQLResolvers({
  Query: {
    async currentUser(root: void, args: void, context: ResolverContext) {
      let user: any = null;
      const userId: string|null = (context as any)?.userId;
      if (userId) {
        user = await context.loaders.Users.load(userId);

        if (user.services) {
          Object.keys(user.services).forEach(key => {
            user.services[key] = {};
          });
        }
      }
      return user;
    },
  },
});
addGraphQLQuery('currentUser: User');

addUniversalFields({collection: Users});

addSlugFields({
  collection: Users,
  getTitle: (u) => u.displayName ?? createDisplayName(u),
  includesOldSlugs: true,
  onCollision: "rejectIfExplicit",
  slugOptions: {
    canUpdate: ['admins'],
    order: 40,
    group: formGroups.adminOptions,
  },
});

makeEditable({
  collection: Users,
  options: {
    // Determines whether to use the comment editor configuration (e.g. Toolbars)
    commentEditor: true,
    // Determines whether to use the comment editor styles (e.g. Fonts)
    commentStyles: true,
    formGroup: formGroups.moderationGroup,
    hidden: isFriendlyUI,
    order: 50,
    fieldName: "moderationGuidelines",
    permissions: {
      canRead: ['guests'],
      canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
      canCreate: [userOwns, 'sunshineRegiment', 'admins']
    }
  }
})

makeEditable({
  collection: Users,
  options: {
    commentEditor: true,
    commentStyles: true,
    formGroup: formGroups.aboutMe,
    hidden: true,
    order: 7,
    fieldName: 'howOthersCanHelpMe',
    label: "How others can help me",
    formVariant: isFriendlyUI ? "grey" : undefined,
    hintText: "Ex: I am looking for opportunities to do...",
    permissions: {
      canRead: ['guests'],
      canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
      canCreate: [userOwns, 'sunshineRegiment', 'admins']
    },
  }
})

makeEditable({
  collection: Users,
  options: {
    commentEditor: true,
    commentStyles: true,
    formGroup: formGroups.aboutMe,
    hidden: true,
    order: 8,
    fieldName: 'howICanHelpOthers',
    label: "How I can help others",
    formVariant: isFriendlyUI ? "grey" : undefined,
    hintText: "Ex: Reach out to me if you have questions about...",
    permissions: {
      canRead: ['guests'],
      canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
      canCreate: [userOwns, 'sunshineRegiment', 'admins']
    },
  }
})

// biography: Some text the user provides for their profile page and to display
// when people hover over their name.
//
// Replaces the old "bio" and "htmlBio" fields, which were markdown only, and
// which now exist as resolver-only fields for back-compatibility.
makeEditable({
  collection: Users,
  options: {
    commentEditor: true,
    commentStyles: true,
    hidden: isEAForum,
    order: isEAForum ? 6 : 40,
    formGroup: isEAForum ? formGroups.aboutMe : formGroups.default,
    fieldName: "biography",
    label: "Bio",
    formVariant: isFriendlyUI ? "grey" : undefined,
    hintText: "Tell us about yourself",
    permissions: {
      canRead: ['guests'],
      canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
      canCreate: [userOwns, 'sunshineRegiment', 'admins']
    },
  }
});

Users.postProcess = (user: DbUser): DbUser => {
  // The `node-postgres` library is smart enough to automatically convert string
  // representations of dates into Javascript Date objects when we have columns
  // of type TIMESTAMPTZ, however, it can't do this automatic conversion when the
  // date is hidden inside a JSON blob. Here, `partiallyReadSequences` is a
  // strongly typed JSON blob (using SimpleSchema) so we need to manually convert
  // to a Date object to avoid a GraphQL error.
  if (user.partiallyReadSequences) {
    for (const partiallyReadSequence of user.partiallyReadSequences) {
      partiallyReadSequence.lastReadTime = new Date(partiallyReadSequence.lastReadTime);
    }
  }
  return user;
}

export default Users;
