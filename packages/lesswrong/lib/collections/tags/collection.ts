import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'
import { makeEditable } from '../../editor/make_editable'
import { userCanCreateTags } from '../../betas';
import { userIsAdmin } from '../../vulcan-users/permissions';
import schema from './schema';
import { tagUserHasSufficientKarma, userIsSubforumModerator } from './helpers';
import { formGroups } from './formGroups';
import { makeSearchable } from '../../make_searchable';

interface ExtendedTagsCollection extends TagsCollection {
  // From search/utils.ts
  toAlgolia: (tag: DbTag) => Promise<Array<AlgoliaDocument>|null>
}

export const EA_FORUM_COMMUNITY_TOPIC_ID = 'ZCihBFp5P64JCvQY6';
export const EA_FORUM_APRIL_FOOLS_DAY_TOPIC_ID = '4saLTjJHsbduczFti';

export const Tags: ExtendedTagsCollection = createCollection({
  collectionName: 'Tags',
  typeName: 'Tag',
  collectionType: 'pg',
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
        if (restricted && !tag.canEditUserIds.includes(user._id)) return false;
        if (!restricted && !tagUserHasSufficientKarma(user, "edit")) return false
      }
      return userCanCreateTags(user);
    },
    removeCheck: (user: DbUser|null, tag: DbTag|null) => {
      return false;
    },
  }),
  logChanges: true,
});

Tags.checkAccess = async (currentUser: DbUser|null, tag: DbTag, context: ResolverContext|null): Promise<boolean> => {
  if (userIsAdmin(currentUser))
    return true;
  else if (tag.deleted)
    return false;
  else
    return true;
}

addUniversalFields({collection: Tags})

makeEditable({
  collection: Tags,
  options: {
    commentStyles: true,
    fieldName: "description",
    getLocalStorageId: (tag, name) => {
      if (tag._id) { return {id: `tag:${tag._id}`, verify:true} }
      return {id: `tag:create`, verify:true}
    },
    revisionsHaveCommitMessages: true,
    permissions: {
      canRead: ['guests'],
      canUpdate: ['members'],
      canCreate: ['members']
    },
    order: 10
  }
});

makeEditable({
  collection: Tags,
  options: {
    formGroup: formGroups.subforumWelcomeMessage,
    fieldName: "subforumWelcomeText",
    permissions: {
      canRead: ['guests'],
      canUpdate: [userIsSubforumModerator, 'sunshineRegiment', 'admins'],
      canCreate: [userIsSubforumModerator, 'sunshineRegiment', 'admins'],
    },
  }
});

makeEditable({
  collection: Tags,
  options: {
    // Determines whether to use the comment editor configuration (e.g. Toolbars)
    commentEditor: true,
    // Determines whether to use the comment editor styles (e.g. Fonts)
    commentStyles: true,
    formGroup: formGroups.subforumModerationGuidelines,
    hidden: true,
    order: 50,
    fieldName: "moderationGuidelines",
    permissions: {
      canRead: ['guests'],
      canUpdate: [userIsSubforumModerator, 'sunshineRegiment', 'admins'],
      canCreate: [userIsSubforumModerator, 'sunshineRegiment', 'admins'],
    },
  }
})

makeSearchable<DbTag>({
  collection: Tags,
  indexableColumns: [
    {selector: `"name"`, priority: "A"},
    {selector: `"description"->'html'`, priority: "B", isHtml: true},
  ],
  headlineTitleSelector: `"name"`,
  headlineBodySelector: `"description"->'html'`,
  filter: (docName: string) => `
    ${docName}."adminOnly" IS NOT TRUE AND
    ${docName}."deleted" IS NOT TRUE`,
  fields: [
    "_id",
    "name",
    "slug",
    "core",
    "defaultOrder",
    "suggestedAsFilter",
    "postCount",
    "wikiOnly",
    "isSubforum",
    "description",
    "bannerImageId",
    "parentTagId",
  ] as const,
  syntheticFields: {
    objectID: (docName: string) => `${docName}."_id"`,
  },
});

export default Tags;
