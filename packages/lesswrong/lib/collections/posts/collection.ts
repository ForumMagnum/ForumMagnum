import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { userOwns, userCanDo, userIsMemberOf, userIsPodcaster } from '../../vulcan-users/permissions';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';
import { canUserEditPostMetadata, userIsPostGroupOrganizer } from './helpers';
import { makeEditable } from '../../editor/make_editable';
import { formGroups } from './formGroups';
import { makeSearchable, SearchJoin } from '../../make_searchable';

export const userCanPost = (user: UsersCurrent|DbUser) => {
  if (user.deleted) return false;
  if (user.postingDisabled) return false
  return userCanDo(user, 'posts.new')
}

const options: MutationOptions<DbPost> = {
  newCheck: (user: DbUser|null) => {
    if (!user) return false;
    return userCanPost(user)
  },

  editCheck: async (user: DbUser|null, document: DbPost|null) => {
    if (!user || !document) return false;
    if (userCanDo(user, 'posts.alignment.move.all') ||
        userCanDo(user, 'posts.alignment.suggest') ||
        userIsMemberOf(user, 'canSuggestCuration')) {
      return true
    }

    
    return canUserEditPostMetadata(user, document) || userIsPodcaster(user) || await userIsPostGroupOrganizer(user, document)
    // note: we can probably get rid of the userIsPostGroupOrganizer call since that's now covered in canUserEditPostMetadata, but the implementation is slightly different and isn't otherwise part of the PR that restrutured canUserEditPostMetadata
  },

  removeCheck: (user: DbUser|null, document: DbPost|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'posts.edit.own') : userCanDo(user, `posts.edit.all`)
  },
}

interface ExtendedPostsCollection extends PostsCollection {
  getSocialPreviewImage: (post: DbPost) => string
  // In search/utils.ts
  toAlgolia: (post: DbPost) => Promise<Array<AlgoliaDocument>|null>
}

export const Posts: ExtendedPostsCollection = createCollection({
  collectionName: 'Posts',
  typeName: 'Post',
  collectionType: 'pg',
  schema,
  resolvers: getDefaultResolvers('Posts'),
  mutations: getDefaultMutations('Posts', options),
  logChanges: true,
});

const userHasModerationGuidelines = (currentUser: DbUser|null): boolean => {
  return !!(currentUser && ((currentUser.moderationGuidelines && currentUser.moderationGuidelines.html) || currentUser.moderationStyle))
}

addUniversalFields({
  collection: Posts,
  createdAtOptions: {canRead: ['admins']},
});

makeEditable({
  collection: Posts,
  options: {
    formGroup: formGroups.content,
    order: 25,
    pingbacks: true,
    permissions: {
      canRead: ['guests'],
      // TODO: we also need to cover userIsPostGroupOrganizer somehow, but we can't right now since it's async
      canUpdate: ['members', 'sunshineRegiment', 'admins'],
      canCreate: ['members']
    },
  }
})

makeEditable({
  collection: Posts,
  options: {
    // Determines whether to use the comment editor configuration (e.g. Toolbars)
    commentEditor: true,
    // Determines whether to use the comment editor styles (e.g. Fonts)
    commentStyles: true,
    formGroup: formGroups.moderationGroup,
    order: 50,
    fieldName: "moderationGuidelines",
    permissions: {
      canRead: ['guests'],
      canUpdate: ['members', 'sunshineRegiment', 'admins'],
      canCreate: [userHasModerationGuidelines]
    },
  }
})

makeEditable({
  collection: Posts,
  options: {
    formGroup: formGroups.highlight,
    fieldName: "customHighlight",
    permissions: {
      canRead: ['guests'],
      canUpdate: ['sunshineRegiment', 'admins'],
      canCreate: ['sunshineRegiment', 'admins'],
    },
  }
})

makeSearchable<DbPost>({
  collection: Posts,
  indexableColumns: [
    {selector: `"_id"`, priority: "A"},
    {selector: `"title"`, priority: "A"},
    {selector: `"author"`, priority: "A"},
    {selector: `"contents"->>'html'`, priority: "B", isHtml: true},
  ],
  headlineTitleSelector: `"title"`,
  headlineBodySelector: `"contents"->'html'`,
  filter: (docName: string) => `
    ${docName}."status" = 2 AND
    ${docName}."baseScore" >= 0 AND
    ${docName}."deletedDraft" IS NOT TRUE AND
    ${docName}."draft" IS NOT TRUE`,
  fields: [
    "_id",
    "userId",
    "url",
    "title",
    "slug",
    "baseScore",
    "status",
    "legacy",
    "commentCount",
    "userIP",
    "createdAt",
    "postedAt",
    "isFuture",
    "isEvent",
    "viewCount",
    "lastCommentedAt",
    "draft",
    "af",
    "feedLink",
  ] as const,
  syntheticFields: {
    curated: (docName: string) => `${docName}."curatedDate" IS NOT NULL`,
    publicDateMs: (docName: string) => `${docName}."postedAt"`,
    tags: (docName: string) =>
      `ARRAY(SELECT JSONB_OBJECT_KEYS(${docName}."tagRelevance"))`,
    objectID: (docName: string) => `${docName}."_id"`,
  },
  joins: [
    {
      docName: "u",
      join: (docName: string) => `"Users" u ON u."_id" = ${docName}."userId"`,
      fields: {
        slug: "authorSlug",
        displayName: "authorDisplayName",
        fullName: "authorFullName",
      } as const,
    } as SearchJoin<DbUser>,
    {
      docName: "r",
      join: (docName: string) => `"RSSFeeds" r ON r."_id" = ${docName}."feedId"`,
      fields: {
        nickname: "feedName",
      } as const,
    } as SearchJoin<DbRSSFeed>,
  ],
});

export default Posts;
