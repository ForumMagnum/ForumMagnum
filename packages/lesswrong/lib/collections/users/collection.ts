import schema from './schema';
import { createCollection, addGraphQLQuery, addGraphQLResolvers } from '../../vulcan-lib';
import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import { addUniversalFields, getDefaultMutations, getDefaultResolvers } from '../../collectionUtils';
import { makeEditable } from '../../editor/make_editable';
import { formGroups } from './formGroups';
import { forumTypeSetting } from '../../instanceSettings';

interface ExtendedUsersCollection extends UsersCollection {
  // Fron search/utils.ts
  toAlgolia: (user: DbUser) => Promise<Array<AlgoliaDocument>|null>
}

export const Users: ExtendedUsersCollection = createCollection({
  collectionName: 'Users',
  typeName: 'User',
  collectionType: forumTypeSetting.get() === "EAForum" ? "switching" : "mongo",
  schema,
  // FIXME: switching this to postgres will cause `insertHashedLoginToken` to fail at the moment because $addToSet hasn't yet been implemented
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
});


const specificResolvers = {
  Query: {
    async currentUser(root, args, context: ResolverContext) {
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
};

addGraphQLResolvers(specificResolvers);
addGraphQLQuery('currentUser: User');

addUniversalFields({collection: Users});

makeEditable({
  collection: Users,
  options: {
    // Determines whether to use the comment editor configuration (e.g. Toolbars)
    commentEditor: true,
    // Determines whether to use the comment editor styles (e.g. Fonts)
    commentStyles: true,
    formGroup: formGroups.moderationGroup,
    order: 50,
    fieldName: "moderationGuidelines",
    permissions: {
      viewableBy: ['guests'],
      editableBy: [userOwns, 'sunshineRegiment', 'admins'],
      insertableBy: [userOwns, 'sunshineRegiment', 'admins']
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
    hintText: "Ex: I am looking for opportunities to do...",
    permissions: {
      viewableBy: ['guests'],
      editableBy: [userOwns, 'sunshineRegiment', 'admins'],
      insertableBy: [userOwns, 'sunshineRegiment', 'admins']
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
    hintText: "Ex: Reach out to me if you have questions about...",
    permissions: {
      viewableBy: ['guests'],
      editableBy: [userOwns, 'sunshineRegiment', 'admins'],
      insertableBy: [userOwns, 'sunshineRegiment', 'admins']
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
    hidden: forumTypeSetting.get() === "EAForum",
    order: forumTypeSetting.get() === "EAForum" ? 6 : 40,
    formGroup: forumTypeSetting.get() === "EAForum" ? formGroups.aboutMe : formGroups.default,
    fieldName: "biography",
    label: "Bio",
    hintText: "Tell us about yourself",
    permissions: {
      viewableBy: ['guests'],
      editableBy: [userOwns, 'sunshineRegiment', 'admins'],
      insertableBy: [userOwns, 'sunshineRegiment', 'admins']
    },
  }
})

export default Users;
