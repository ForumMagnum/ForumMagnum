import { schemaDefaultValue } from '../../collectionUtils'
import { arrayOfForeignKeysField, denormalizedCountOfReferences, foreignKeyField, resolverOnlyField, accessFilterMultiple } from '../../utils/schemaUtils';
import SimpleSchema from 'simpl-schema';
import { Utils, slugify } from '../../vulcan-lib/utils';
import { addGraphQLSchema } from '../../vulcan-lib/graphql';
import { getWithLoader } from '../../loaders';
import GraphQLJSON from 'graphql-type-json';
import moment from 'moment';
import { captureException } from '@sentry/core';
import { forumTypeSetting, taggingNamePluralSetting, taggingNameSetting } from '../../instanceSettings';
import { SORT_ORDER_OPTIONS, SettingsOption } from '../posts/sortOrderOptions';
import { formGroups } from './formGroups';
import Comments from '../comments/collection';
import UserTagRels from '../userTagRels/collection';
import { getDefaultViewSelector } from '../../utils/viewUtils';
import { preferredHeadingCase } from '../../forumTypeUtils';

addGraphQLSchema(`
  type TagContributor {
    user: User
    contributionScore: Int!
    numCommits: Int!
    voteCount: Int!
  }
  type TagContributorsList {
    contributors: [TagContributor!]
    totalCount: Int!
  }
`);

export const TAG_POSTS_SORT_ORDER_OPTIONS:  { [key: string]: SettingsOption; }  = {
  relevance: { label: preferredHeadingCase('Most Relevant') },
  ...SORT_ORDER_OPTIONS,
}

const schema: SchemaType<DbTag> = {
  name: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    order: 1,
  },
  shortName: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    optional: true,
    nullable: true,
    group: formGroups.advancedOptions,
  },
  slug: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.advancedOptions,
    onInsert: async (tag) => {
      const basicSlug = slugify(tag.name);
      return await Utils.getUnusedSlugByCollectionName('Tags', basicSlug, true);
    },
    onUpdate: async ({data, oldDocument}) => {
      if (data.slug && data.slug !== oldDocument.slug) {
        const slugIsUsed = await Utils.slugIsUsed("Tags", data.slug)
        if (slugIsUsed) {
          throw Error(`Specified slug is already used: ${data.slug}`)
        }
      } else if (data.name && data.name !== oldDocument.name) {
        return await Utils.getUnusedSlugByCollectionName("Tags", slugify(data.name), true, oldDocument._id)
      }
    }
  },
  oldSlugs: {
    type: Array,
    optional: true,
    canRead: ['guests'],
    onUpdate: ({data, oldDocument}) => {
      if ((data.slug && data.slug !== oldDocument.slug) || (data.name && data.name !== oldDocument.name))  {
        return [...(oldDocument.oldSlugs || []), oldDocument.slug]
      } 
    }
  },
  'oldSlugs.$': {
    type: String,
    optional: true,
    canRead: ['guests'],
  },
  core: {
    label: "Core Tag (moderators check whether it applies when reviewing new posts)",
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.advancedOptions,
    optional: true,
    ...schemaDefaultValue(false),
  },
  suggestedAsFilter: {
    label: "Suggested Filter (appears as a default option in filter settings without having to use the search box)",
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.advancedOptions,
    optional: true,
    ...schemaDefaultValue(false),
  },
  defaultOrder: {
    type: Number,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.advancedOptions,
    optional: true,
    ...schemaDefaultValue(0),
    tooltip: `Rank this ${taggingNameSetting.get()} higher in lists of ${taggingNamePluralSetting.get()}?`
  },
  descriptionTruncationCount: {
    // number of paragraphs to display above-the-fold
    type: Number,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.advancedOptions,
    optional: true,
    ...schemaDefaultValue(0),
    // schemaDefaultValue throws an error if this is set to null, but we want to allow that
    onUpdate: () => {},
  },
  postCount: {
    ...denormalizedCountOfReferences({
      fieldName: "postCount",
      collectionName: "Tags",
      foreignCollectionName: "TagRels",
      foreignTypeName: "TagRel",
      foreignFieldName: "tagId",
      //filterFn: tagRel => tagRel.baseScore > 0, //TODO: Didn't work with filter; votes are bypassing the relevant callback?
    }),
    viewableBy: ['guests'],
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    onCreate: ({currentUser}) => currentUser!._id,
    viewableBy: ['guests'],
    optional: true
  },
  adminOnly: {
    label: "Admin Only",
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.advancedOptions,
    optional: true,
    ...schemaDefaultValue(false),
  },
  canEditUserIds: {
    type: Array,
    viewableBy: ['guests'],
    insertableBy: ['sunshineRegiment', 'admins'],
    editableBy: ['sunshineRegiment', 'admins'],
    optional: true,
    label: "Restrict to these authors",
    tooltip: "Only these authors will be able to edit the topic",
    control: "UsersListEditor",
    group: formGroups.advancedOptions,
  },
  'canEditUserIds.$': {
    type: String,
    foreignKey: 'Users',
    optional: true,
  },
  charsAdded: {
    type: Number,
    optional: true,
    viewableBy: ['guests'],
  },
  charsRemoved: {
    type: Number,
    optional: true,
    viewableBy: ['guests'],
  },
  deleted: {
    type: Boolean,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    optional: true,
    group: formGroups.advancedOptions,
    ...schemaDefaultValue(false),
  },
  lastCommentedAt: {
    type: Date,
    denormalized: true,
    optional: true,
    viewableBy: ['guests'],
  },
  lastSubforumCommentAt: {
    type: Date,
    denormalized: true,
    optional: true,
    viewableBy: ['guests'],
  },
  needsReview: {
    type: Boolean,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    group: formGroups.advancedOptions,
    optional: true,
    ...schemaDefaultValue(true)
  },
  reviewedByUserId: {
    ...foreignKeyField({
      idFieldName: "reviewedByUserId",
      resolverName: "reviewedByUser",
      collectionName: "Users",
      type: "User",
    }),
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    hidden: true,
  },
  // What grade is the current tag? See the wikiGradeDefinitions variable defined below for details.
  wikiGrade: {
    type: SimpleSchema.Integer, 
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    control: 'select',
    options: () => Object.entries(wikiGradeDefinitions).map(([grade, name]) => ({
      value: parseInt(grade),
      label: name
    })),
    group: formGroups.advancedOptions,
    optional: true,
    ...schemaDefaultValue(2),
  },

  recentComments: resolverOnlyField({
    type: Array,
    graphQLtype: "[Comment]",
    viewableBy: ['guests'],
    graphqlArguments: 'tagCommentsLimit: Int, maxAgeHours: Int, af: Boolean, tagCommentType: String',
    resolver: async (tag, { tagCommentsLimit=5, maxAgeHours=18, af=false, tagCommentType = "DISCUSSION" }, context: ResolverContext) => {
      const { currentUser, Comments } = context;
      const lastCommentTime = tagCommentType === "SUBFORUM" ? tag.lastSubforumCommentAt : tag.lastCommentedAt
      const timeCutoff = moment(lastCommentTime).subtract(maxAgeHours, 'hours').toDate();

      const comments = await Comments.find({
        ...getDefaultViewSelector("Comments"),
        tagId: tag._id,
        score: {$gt:0},
        deletedPublic: false,
        postedAt: {$gt: timeCutoff},
        tagCommentType: tagCommentType,
        ...(af ? {af:true} : {}),
      }, {
        limit: tagCommentsLimit,
        sort: {postedAt:-1}
      }).fetch();
      return await accessFilterMultiple(currentUser, Comments, comments, context);
    }
  }),
  'recentComments.$': {
    type: Object,
    foreignKey: 'Comments',
  },

  wikiOnly: {
    type: Boolean,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    group: formGroups.advancedOptions,
    optional: true,
    ...schemaDefaultValue(false),
  },
  
  // Cloudinary image id for the banner image (high resolution)
  bannerImageId: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    label: "Banner Image",
    control: "ImageUpload",
    tooltip: "Minimum 200x600 px",
    group: formGroups.advancedOptions,
    hidden: forumTypeSetting.get() !== 'EAForum',
  },
  // Cloudinary image id for the square image which shows up in the all topics page, this will usually be a cropped version of the banner image
  squareImageId: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    label: "Square Image",
    control: "ImageUpload",
    tooltip: "Minimum 200x200 px",
    group: formGroups.advancedOptions,
    hidden: forumTypeSetting.get() !== 'EAForum',
  },

  tagFlagsIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "tagFlagsIds",
      resolverName: "tagFlags",
      collectionName: "TagFlags",
      type: "TagFlag",
    }),
    control: 'TagFlagToggleList',
    label: "Flags: ",
    order: 30,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins']
  },
  'tagFlagsIds.$': {
    type: String,
    foreignKey: 'TagFlags',
    optional: true
  },
  // Populated by the LW 1.0 wiki import, with the revision number
  // that has the last full state of the imported post
  lesswrongWikiImportRevision: {
    type: String,
    optional: true,
    viewableBy: ['guests']
  },
  lesswrongWikiImportSlug: {
    type: String,
    optional: true,
    viewableBy: ['guests']
  },
  lesswrongWikiImportCompleted: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests']
  },
  
  // lastVisitedAt: If the user is logged in and has viewed this tag, the date
  // they last viewed it. Otherwise, null.
  lastVisitedAt: resolverOnlyField({
    type: Date,
    viewableBy: ['guests'],
    optional: true,
    resolver: async (tag: DbTag, args: void, context: ResolverContext) => {
      const { ReadStatuses, currentUser } = context;
      if (!currentUser) return null;

      const readStatus = await getWithLoader(context, ReadStatuses,
        `tagReadStatuses`,
        { userId: currentUser._id },
        'tagId', tag._id
      );
      if (!readStatus.length) return null;
      return readStatus[0].lastUpdated;
    }
  }),
  
  isRead: resolverOnlyField({
    type: Boolean,
    viewableBy: ['guests'],
    optional: true,
    resolver: async (tag: DbTag, args: void, context: ResolverContext) => {
      const { ReadStatuses, currentUser } = context;
      if (!currentUser) return false;
      
      const readStatus = await getWithLoader(context, ReadStatuses,
        `tagReadStatuses`,
        { userId: currentUser._id },
        'tagId', tag._id
      );
      if (!readStatus.length) return false;
      return readStatus[0].isRead;
    }
  }),

  tableOfContents: resolverOnlyField({
    type: Object,
    viewableBy: ['guests'],
    graphQLtype: GraphQLJSON,
    graphqlArguments: 'version: String',
    resolver: async (document: DbTag, args: {version: string}, context: ResolverContext) => {
      try {
        return await Utils.getToCforTag({document, version: args.version||null, context});
      } catch(e) {
        captureException(e);
        return null;
      }
    }
  }),
  
  htmlWithContributorAnnotations: {
    type: String,
    viewableBy: ['guests'],
    optional: true,
    hidden: true,
    denormalized: true,
  },
  
  // See resolver in tagResolvers.ts. Takes optional limit and version arguments.
  // Returns a list of contributors and the total karma of their contributions
  // (counting only up to the specified revision, if a revision is specified).
  contributors: {
    viewableBy: ['guests'],
    type: "TagContributorsList",
    optional: true,
  },
  
  // Denormalized copy of contribution-stats, for the latest revision.
  // Replaces contributionScores, which was the same denormalized thing but for
  // contribution scores only, without number of commits and vote count, and
  // which is no longer on the schema.
  contributionStats: {
    type: Object,
    optional: true,
    blackbox: true,
    hidden: true,
    viewableBy: ['guests'],
    denormalized: true,
  },
  
  introSequenceId: {
    ...foreignKeyField({
      idFieldName: "introSequenceId",
      resolverName: "sequence",
      collectionName: "Sequences",
      type: "Sequence",
      nullable: true,
    }),
    optional: true,
    group: formGroups.advancedOptions,
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
  },
  
  postsDefaultSortOrder: {
    type: String,
    optional: true,
    group: formGroups.advancedOptions,
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    control: 'select',
    options: () => Object.entries(TAG_POSTS_SORT_ORDER_OPTIONS).map(([key, val]) => ({
      value: key,
      label: val.label
    })),
  },

  canVoteOnRels: {
    type: Array,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    optional: true,
    group: formGroups.advancedOptions,
  },
  'canVoteOnRels.$': {
    type: String,
  },
  isSubforum: {
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.advancedOptions,
    optional: true,
    ...schemaDefaultValue(false),
  },
  subforumUnreadMessagesCount: resolverOnlyField({
    type: Number,
    nullable: true,
    canRead: ['guests'],
    resolver: async (tag: DbTag, args: void, context: ResolverContext) => {
      if (!tag.isSubforum) return null;
      const userTagRel = context.currentUser ? await UserTagRels.findOne({userId: context.currentUser._id, tagId: tag._id}) : null;
      // This is when this field was added, so assume all messages before then have been read
      const earliestDate = new Date('2022-09-30T15:07:34.026Z');
      
      if (!userTagRel) {
        return await Comments.find({tagId: tag._id, tagCommentType: "SUBFORUM", deleted: {$ne: true}, postedAt: {$gt: earliestDate}}).count()
      }

      if (!userTagRel?.subforumShowUnreadInSidebar) return null;

      const userLastVisitedAt = userTagRel?.subforumLastVisitedAt || earliestDate;
      const count = await Comments.find({tagId: tag._id, tagCommentType: "SUBFORUM", deleted: {$ne: true}, postedAt: {$gt: userLastVisitedAt}}).count()

      return count
    },
  }),
  subforumModeratorIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "subforumModeratorIds",
      resolverName: "subforumModerators",
      collectionName: "Users",
      type: "User",
    }),
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.advancedOptions,
    optional: true,
    control: "UsersListEditor",
    label: "Subforum Moderators",
  },
  'subforumModeratorIds.$': {
    type: String,
    foreignKey: "Users",
    optional: true,
  },
  subforumIntroPostId: {
    ...foreignKeyField({
      idFieldName: "subforumIntroPostId",
      resolverName: "subforumIntroPost",
      collectionName: "Posts",
      type: "Post",
    }),
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    label: "Subforum intro post ID",
    tooltip: "Dismissable intro post that will appear at the top of the subforum feed",
    group: formGroups.advancedOptions,
  },
  parentTagId: {
    ...foreignKeyField({
      idFieldName: "parentTagId",
      resolverName: "parentTag",
      collectionName: "Tags",
      type: "Tag",
    }),
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    label: "Parent Tag",
    tooltip: "Parent tag which will also be applied whenever this tag is applied to a post for the first time",
    group: formGroups.advancedOptions,
    control: 'TagSelect',
    onCreate: async ({newDocument: tag, context }) => {
      if (tag.parentTagId) {
        // don't allow chained parent tag relationships
        const { Tags } = context;
        if ((await Tags.find({parentTagId: tag._id}).count())) {
          throw Error(`Tag ${tag.name} is a parent tag of another tag.`);
        }
      }
      return tag.parentTagId
    },
    onUpdate: async ({data, oldDocument, context}) => {
      if (data.parentTagId) {
        if (data.parentTagId === oldDocument._id) {
          throw Error(`Can't set self as parent tag.`);
        }
        const { Tags } = context;
        // don't allow chained parent tag relationships
        if (await Tags.find({parentTagId: oldDocument._id}).count()) {
          throw Error(`Tag ${oldDocument.name} is a parent tag of another tag.`);
        }
      }
      return data.parentTagId
    },
  },
  subTagIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "subTagIds",
      resolverName: "subTags",
      collectionName: "Tags",
      type: "Tag"
    }),
    optional: true,
    // To edit this, you have to edit the parent tag of the tag you are adding, and this will be automatically updated. It's like this for
    // largely historical reasons, we didn't used to materialise the sub tag ids at all, but this had performance issues
    hidden: true,
    viewableBy: ["guests"],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
  },
  'subTagIds.$': {
    type: String,
    foreignKey: "Tags",
    optional: true,
  },
  autoTagModel: {
    type: String,
    label: "Auto-tag classifier model ID",
    optional: true,
    viewableBy: ['admins'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    group: formGroups.advancedOptions,
    nullable: true,
    ...schemaDefaultValue(""),
  },
  
  autoTagPrompt: {
    type: String,
    label: "Auto-tag classifier prompt string",
    optional: true,
    viewableBy: ['admins'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    group: formGroups.advancedOptions,
    nullable: true,
    ...schemaDefaultValue(""),
  },
}

export default schema;

export const wikiGradeDefinitions: Partial<Record<number,string>> = {
  0: "Uncategorized",
  1: "Flagged",
  2: "Stub",
  3: "C-Class",
  4: "B-Class",
  5: "A-Class"
}
