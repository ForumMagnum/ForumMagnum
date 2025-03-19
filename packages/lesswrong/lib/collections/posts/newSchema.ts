// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { getDomain, getOutgoingUrl } from "../../vulcan-lib/utils";
import moment from "moment";
import {
  schemaDefaultValue, googleLocationToMongoLocation, accessFilterMultiple,
  accessFilterSingle, arrayOfForeignKeysOnCreate,
  generateIdResolverMulti,
  generateIdResolverSingle,
  getDenormalizedCountOfReferencesGetValue,
  getDenormalizedFieldOnCreate,
  getDenormalizedFieldOnUpdate,
  getForeignKeySqlResolver
} from "../../utils/schemaUtils";
import {
  postCanEditHideCommentKarma,
  postGetPageUrl,
  postGetEmailShareUrl,
  postGetTwitterShareUrl,
  postGetFacebookShareUrl,
  postGetDefaultStatus,
  getSocialPreviewImage, isNotHostedHere
} from "./helpers";
import { postStatuses, postStatusLabels, sideCommentAlwaysExcludeKarma, sideCommentFilterMinKarma } from "./constants";
import { userGetDisplayNameById } from "../../vulcan-users/helpers";
import { loadByIds, getWithLoader, getWithCustomLoader } from "../../loaders";
import { formGroups } from "./formGroups";
import SimpleSchema from "simpl-schema";
import { DEFAULT_QUALITATIVE_VOTE } from "../reviewVotes/schema";
import { getCollaborativeEditorAccess } from "./collabEditingPermissions";
import { getVotingSystems } from "../../voting/votingSystems";
import {
  eaFrontpageDateDefault, fmCrosspostBaseUrlSetting, fmCrosspostSiteNameSetting, isEAForum,
  isLWorAF, requireReviewToFrontpagePostsSetting, reviewUserBotSetting
} from "../../instanceSettings";
import { forumSelect } from "../../forumTypeUtils";
import * as _ from "underscore";
import { localGroupTypeFormOptions } from "../localgroups/groupTypes";
import { userCanCommentLock, userCanModeratePost, userIsSharedOn } from "../users/helpers";
import {
  sequenceGetNextPostID,
  sequenceGetPrevPostID,
  sequenceContainsPost,
  getPrevPostIdFromPrevSequence,
  getNextPostIdFromNextSequence,
} from "../sequences/helpers";
import { allOf } from "../../utils/functionUtils";
import { crosspostKarmaThreshold } from "../../publicSettings";
import { getDefaultViewSelector } from "../../utils/viewUtils";
import { addGraphQLSchema } from "../../vulcan-lib/graphql";
import {
  hasAuthorModeration, hasSideComments, hasSidenotes, userCanCreateAndEditJargonTerms,
  userCanViewJargonTerms
} from "../../betas";
import { isFriendlyUI } from "../../../themes/forumTheme";
import { stableSortTags } from "../tags/helpers";
import { getLatestContentsRevision } from "../../../server/collections/revisions/helpers";
import { marketInfoLoader } from "./annualReviewMarkets";
import mapValues from "lodash/mapValues";
import groupBy from "lodash/groupBy";
import {
  documentIsNotDeleted,
  userIsAdminOrMod,
  userOverNKarmaFunc,
  userOverNKarmaOrApproved,
  userOwns,
} from "../../vulcan-users/permissions";
import { defaultEditorPlaceholder, getDefaultLocalStorageIdGenerator, getDenormalizedEditableResolver, getNormalizedEditableResolver, getNormalizedEditableSqlResolver, getRevisionsResolver, getVersionResolver } from "@/lib/editor/make_editable";
import { currentUserExtendedVoteResolver, currentUserVoteResolver, getAllVotes, getCurrentUserVotes } from "@/lib/make_voteable";
import { SmartFormProps } from "@/components/vulcan-forms/propTypes";
import { isDialogueParticipant } from "@/components/posts/PostsPage/PostsPage";
import Comments from "@/server/collections/comments/collection";
import { dataToMarkdown } from "@/server/editor/conversionUtils";
import { getLatestRev } from "@/server/editor/utils";
import { fetchFragmentSingle } from "@/server/fetchFragment";
import { languageModelGenerateText } from "@/server/languageModels/languageModelIntegration";
import { getLocalTime } from "@/server/mapsUtils";
import { getDefaultPostLocationFields, getDialogueMessageTimestamps, getPostHTML, getDialogueResponseIds } from "@/server/posts/utils";
import { getPostReviewWinnerInfo } from "@/server/review/reviewWinnersCache";
import { matchSideComments } from "@/server/sideComments";
import { getToCforPost } from "@/server/tableOfContents";
import { cheerioParse } from "@/server/utils/htmlUtil";
import { captureException } from "@sentry/core";
import { keyBy } from "lodash";

// TODO: This disagrees with the value used for the book progress bar
export const READ_WORDS_PER_MINUTE = 250;

const urlHintText = isEAForum
  ? "UrlHintText"
  : "Please write what you liked about the post and sample liberally! If the author allows it, copy in the entire post text. (Link-posts without text get far fewer views and most people don't click offsite links.)";

const STICKY_PRIORITIES = {
  1: "Low",
  2: "Normal",
  3: "Elevated",
  4: "Max",
};

export function getDefaultVotingSystem() {
  return forumSelect({
    EAForum: "eaEmojis",
    LessWrong: "namesAttachedReactions",
    AlignmentForum: "namesAttachedReactions",
    default: "default",
  });
}

export interface RSVPType {
  name: string;
  email: string;
  nonPublic: boolean;
  response: "yes" | "maybe" | "no";
  userId: string;
  createdAt: Date;
}
const rsvpType = new SimpleSchema({
  name: {
    type: String,
  },
  email: {
    type: String,
    optional: true,
  },
  nonPublic: {
    type: Boolean,
    optional: true,
  },
  response: {
    type: String,
    allowedValues: ["yes", "maybe", "no"],
  },
  userId: {
    type: String,
    optional: true,
    nullable: true,
  },
  createdAt: {
    type: Date,
    optional: true,
  },
});

const coauthorStatusSchema = new SimpleSchema({
  userId: String,
  confirmed: Boolean,
  requested: Boolean,
});

const socialPreviewSchema = new SimpleSchema({
  imageId: {
    type: String,
    optional: true,
    nullable: true,
  },
  text: {
    type: String,
    optional: true,
    nullable: true,
  },
});

addGraphQLSchema(`
  type SocialPreviewType {
    _id: String
    imageId: String
    imageUrl: String
    text: String
  }
`);

const crosspostSchema = new SimpleSchema({
  isCrosspost: Boolean,
  hostedHere: { type: Boolean, optional: true, nullable: true },
  foreignPostId: { type: String, optional: true, nullable: true },
});

export const MINIMUM_COAUTHOR_KARMA = 1;

export const EVENT_TYPES = [
  { value: "presentation", label: "Presentation" },
  { value: "discussion", label: "Discussion" },
  { value: "workshop", label: "Workshop" },
  { value: "social", label: "Social" },
  { value: "coworking", label: "Coworking" },
  { value: "course", label: "Course" },
  { value: "conference", label: "Conference" },
];

export async function getLastReadStatus(post: DbPost, context: ResolverContext) {
  const { currentUser, ReadStatuses } = context;
  if (!currentUser) return null;

  const readStatus = await getWithLoader(
    context,
    ReadStatuses,
    `readStatuses`,
    { userId: currentUser._id },
    "postId",
    post._id
  );
  if (!readStatus.length) return null;
  return readStatus[0];
}

export const sideCommentCacheVersion = 1;
export interface SideCommentsCache {
  version: number;
  createdAt: Date;
  annotatedHtml: string;
  commentsByBlock: Record<string, string[]>;
}
export interface SideCommentsResolverResult {
  html: string;
  commentsByBlock: Record<string, string[]>;
  highKarmaCommentsByBlock: Record<string, string[]>;
}

/**
 * Structured this way to ensure lazy evaluation of `crosspostKarmaThreshold` each time we check for a given user, rather than once on server start
 */
const userPassesCrosspostingKarmaThreshold = (user: DbUser | UsersMinimumInfo | null) => {
  const currentKarmaThreshold = crosspostKarmaThreshold.get();

  return currentKarmaThreshold === null
    ? true
    : // userOverNKarmaFunc checks greater than, while we want greater than or equal to, since that's the check we're performing elsewhere
      // so just subtract one
      userOverNKarmaFunc(currentKarmaThreshold - 1)(user);
};

const schemaDefaultValueFmCrosspost = schemaDefaultValue<"Posts">({
  isCrosspost: false,
});

const userHasModerationGuidelines = (currentUser: DbUser | null): boolean => {
  if (!hasAuthorModeration) {
    return false;
  }
  return !!(
    currentUser &&
    ((currentUser.moderationGuidelines && currentUser.moderationGuidelines.html) || currentUser.moderationStyle)
  );
};

function shouldHideEndTime(props: SmartFormProps<"Posts">): boolean {
  return !props.eventForm || props.document?.eventType === "course";
}

const hq3cSx = () => defaultEditorPlaceholder;
const h4eSQo = () => {
  return new Date();
};
const hxjPay = (props) => !props.eventForm;
const hQrRp7 = (data) => "startTime" in data || "googleLocation" in data;
const hjM6A7 = async (post) => {
  if (!post.startTime) return null;
  const googleLocation = post.googleLocation || (await getDefaultPostLocationFields(post)).googleLocation;
  if (!googleLocation) return null;
  return await getLocalTime(post.startTime, googleLocation);
};
const hKNgTF = (data) => "endTime" in data || "googleLocation" in data;
const haJvcc = async (post) => {
  if (!post.endTime) return null;
  const googleLocation = post.googleLocation || (await getDefaultPostLocationFields(post)).googleLocation;
  if (!googleLocation) return null;
  return await getLocalTime(post.endTime, googleLocation);
};
const h9LCpv = (data) => "googleLocation" in data;
const hEpEiL = async (post) => {
  if (post.googleLocation) return googleLocationToMongoLocation(post.googleLocation);
  return null;
};
const hxrFo8 = async (post, context) => {
  if ((!post.debate && !post.collabEditorDialogue) || post.draft) return null;
  const messageTimestamps = await getDialogueMessageTimestamps(post, context);
  if (messageTimestamps.length === 0) {
    return null;
  }
  const lastTimestamp = messageTimestamps[messageTimestamps.length - 1];
  return lastTimestamp;
};

const schema = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  schemaVersion: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 1,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      onUpdate: () => 1,
      validation: {
        optional: true,
      },
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      canRead: ["admins"],
      onCreate: () => new Date(),
      validation: {
        optional: true,
      },
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  contents: {
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      editableFieldOptions: { pingbacks: true, normalized: true },
      arguments: "version: String",
      resolver: getNormalizedEditableResolver("contents"),
      sqlResolver: getNormalizedEditableSqlResolver("contents"),
    },
    form: {
      form: {
        hintText: hq3cSx,
        fieldName: "contents",
        collectionName: "Posts",
        commentEditor: false,
        commentStyles: false,
        hideControls: false,
      },
      order: 25,
      control: "EditorFormComponent",
      hidden: false,
      group: () => formGroups.content,
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("Posts"),
        hasToc: true,
        revisionsHaveCommitMessages: false,
      },
    },
  },
  contents_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  revisions: {
    graphql: {
      outputType: "[Revision]",
      canRead: ["guests"],
      arguments: "limit: Int = 5",
      resolver: getRevisionsResolver("revisions"),
    },
  },
  version: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("version"),
    },
  },
  pingbacks: {
    database: {
      type: "JSONB",
      denormalized: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: "guests",
      validation: {
        optional: true,
      },
    },
  },
  moderationGuidelines: {
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: [userHasModerationGuidelines],
      editableFieldOptions: { pingbacks: false, normalized: true },
      arguments: "version: String",
      resolver: getNormalizedEditableResolver("moderationGuidelines"),
      sqlResolver: getNormalizedEditableSqlResolver("moderationGuidelines"),
    },
    form: {
      form: {
        hintText: hq3cSx,
        fieldName: "moderationGuidelines",
        collectionName: "Posts",
        commentEditor: true,
        commentStyles: true,
        hideControls: false,
      },
      order: 50,
      control: "EditorFormComponent",
      hidden: isFriendlyUI,
      group: () => formGroups.moderationGroup,
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("Posts"),
        revisionsHaveCommitMessages: false,
      },
    },
  },
  moderationGuidelines_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  moderationGuidelinesRevisions: {
    graphql: {
      outputType: "[Revision]",
      canRead: ["guests"],
      arguments: "limit: Int = 5",
      resolver: getRevisionsResolver("moderationGuidelinesRevisions"),
    },
  },
  moderationGuidelinesVersion: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("moderationGuidelinesVersion"),
    },
  },
  customHighlight: {
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Posts", "customHighlight"),
    },
    form: {
      form: {
        hintText: hq3cSx,
        fieldName: "customHighlight",
        collectionName: "Posts",
        commentEditor: false,
        commentStyles: false,
        hideControls: false,
      },
      order: 0,
      control: "EditorFormComponent",
      hidden: false,
      group: () => formGroups.highlight,
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("Posts"),
        revisionsHaveCommitMessages: false,
      },
    },
  },
  customHighlight_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  customHighlightRevisions: {
    graphql: {
      outputType: "[Revision]",
      canRead: ["guests"],
      arguments: "limit: Int = 5",
      resolver: getRevisionsResolver("customHighlightRevisions"),
    },
  },
  customHighlightVersion: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("customHighlightVersion"),
    },
  },
  slug: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      slugCallbackOptions: {
        collectionsToAvoidCollisionsWith: ["Posts"],
        getTitle: (post) => post.title,
        onCollision: "newDocumentGetsSuffix",
        includesOldSlugs: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  postedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      onCreate: ({ document: post, currentUser }) => {
        // Set the post's postedAt if it's going to be approved
        if (!post.postedAt && postGetDefaultStatus(currentUser) === postStatuses.STATUS_APPROVED) {
          return new Date();
        }
      },
      onUpdate: ({ modifier, newDocument: post }) => {
        // Set the post's postedAt if it's going to be approved
        if (!post.postedAt && modifier.$set.status === postStatuses.STATUS_APPROVED) {
          return new Date();
        }
      },
      validation: {
        optional: true,
      },
    },
    form: {
      control: "datetime",
      group: () => formGroups.adminOptions,
    },
  },
  modifiedAt: {
    database: {
      type: "TIMESTAMPTZ",
      denormalized: true,
      canAutoDenormalize: true,
      getValue: h4eSQo,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: getDenormalizedFieldOnCreate<"Posts">({ getValue: h4eSQo }),
      onUpdate: getDenormalizedFieldOnUpdate<"Posts">({ getValue: h4eSQo }),
      validation: {
        optional: true,
      },
    },
  },
  url: {
    database: {
      type: "VARCHAR(500)",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      max: 500,
      form: { labels: { inactive: "Link-post?", active: "Add a linkpost URL" }, hintText: () => urlHintText },
      order: 12,
      control: "EditLinkpostUrl",
      hidden: (props) => props.eventForm || props.debateForm || props.collabEditorDialogue,
      group: () => formGroups.options,
    },
  },
  postCategory: {
    database: {
      type: "TEXT",
      defaultValue: "post",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        allowedValues: ["post", "linkpost", "question"],
        optional: true,
      },
    },
    form: {
      order: 9,
      control: "EditPostCategory",
      hidden: (props) => props.eventForm || props.debateForm || props.collabEditorDialogue,
      group: () => formGroups.category,
    },
  },
  title: {
    database: {
      type: "VARCHAR(500)",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
    form: {
      max: 500,
      order: 10,
      control: "EditTitle",
      placeholder: "Title",
      group: () => formGroups.title,
    },
  },
  viewCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  lastCommentedAt: {
    database: {
      type: "TIMESTAMPTZ",
      denormalized: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: ({ document: post }) => post.postedAt || new Date(),
      validation: {
        optional: true,
      },
    },
  },
  clickCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  deletedDraft: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members"],
      onUpdate: ({ data, document, oldDocument, currentUser }) => {
        if (!currentUser?.isAdmin && oldDocument.deletedDraft && !document.deletedDraft) {
          throw new Error("You cannot un-delete posts");
        }
        return data.deletedDraft;
      },
      validation: {
        optional: true,
      },
    },
  },
  status: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins"],
      onCreate: ({ document, currentUser }) => {
        if (!document.status) {
          return postGetDefaultStatus(currentUser);
        }
      },
      onUpdate: ({ modifier, document, currentUser }) => {
        // if for some reason post status has been removed, give it default status
        if (modifier.$unset && modifier.$unset.status) {
          return postGetDefaultStatus(currentUser);
        }
      },
      validation: {
        optional: true,
      },
    },
    form: {
      options: () => postStatusLabels,
      control: "select",
      group: () => formGroups.adminOptions,
    },
  },
  isFuture: {
    database: {
      type: "BOOL",
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      onCreate: ({ document: post }) => {
        // Set the post's isFuture to true if necessary
        if (post.postedAt) {
          const postTime = new Date(post.postedAt).getTime();
          const currentTime = new Date().getTime() + 1000;
          return postTime > currentTime; // round up to the second
        } else {
          return false;
        }
      },
      onUpdate: ({ modifier, newDocument: post }) => {
        // Set the post's isFuture to true if necessary
        if (modifier.$set.postedAt) {
          const postTime = new Date(modifier.$set.postedAt).getTime();
          const currentTime = new Date().getTime() + 1000;
          if (postTime > currentTime) {
            // if a post's postedAt date is in the future, set isFuture to true
            return true;
          } else if (post.isFuture) {
            // else if a post has isFuture to true but its date is in the past, set isFuture to false
            return false;
          }
        }
      },
      validation: {
        optional: true,
      },
    },
  },
  sticky: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      onCreate: ({ document: post }) => {
        if (!post.sticky) {
          return false;
        }
      },
      onUpdate: ({ modifier }) => {
        if (!modifier.$set.sticky) {
          return false;
        }
      },
      validation: {
        optional: true,
      },
    },
    form: {
      order: 10,
      control: "checkbox",
      group: () => formGroups.adminOptions,
    },
  },
  stickyPriority: {
    database: {
      type: "INTEGER",
      defaultValue: 2,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Int",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      options: () =>
        Object.entries(STICKY_PRIORITIES).map(([level, name]) => ({
          value: parseInt(level),
          label: name,
        })),
      order: 11,
      control: "select",
      group: () => formGroups.adminOptions,
    },
  },
  userIP: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  userAgent: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  referrer: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  author: {
    database: {
      type: "TEXT",
      denormalized: true,
    },
    graphql: {
      outputType: "String",
      canRead: [documentIsNotDeleted],
      onUpdate: async ({ modifier, document, currentUser, context }) => {
        // if userId is changing, change the author name too
        if (modifier.$set && modifier.$set.userId) {
          return await userGetDisplayNameById(modifier.$set.userId, context);
        }
      },
      validation: {
        optional: true,
      },
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: [documentIsNotDeleted],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      tooltip: "The user id of the author",
      control: "text",
      group: () => formGroups.adminOptions,
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: [documentIsNotDeleted],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  domain: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: (post, args, context) => getDomain(post.url),
    },
  },
  pageUrl: {
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      resolver: (post, args, context) => postGetPageUrl(post, true),
    },
  },
  pageUrlRelative: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: (post, args, context) => postGetPageUrl(post, false),
    },
  },
  linkUrl: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: (post, args, context) => {
        return post.url ? getOutgoingUrl(post.url) : postGetPageUrl(post, true);
      },
    },
  },
  postedAtFormatted: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: (post, args, context) => {
        return moment(post.postedAt).format("dddd, MMMM Do YYYY");
      },
    },
  },
  emailShareUrl: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: (post, args, context) => postGetEmailShareUrl(post),
    },
  },
  twitterShareUrl: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: (post, args, context) => postGetTwitterShareUrl(post),
    },
  },
  facebookShareUrl: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: (post, args, context) => postGetFacebookShareUrl(post),
    },
  },
  socialPreviewImageUrl: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: (post, args, context) => getSocialPreviewImage(post),
    },
  },
  question: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  authorIsUnreviewed: {
    database: {
      type: "BOOL",
      defaultValue: false,
      denormalized: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  readTimeMinutesOverride: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Read time (minutes)",
      tooltip: "By default, this is calculated from the word count. Enter a value to override.",
      control: "FormComponentNumber",
      group: () => formGroups.adminOptions,
    },
  },
  readTimeMinutes: {
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
      resolver: async (post, _args, context) => {
        const normalizeValue = (value) => Math.max(1, Math.round(value));
        if (typeof post.readTimeMinutesOverride === "number") {
          return normalizeValue(post.readTimeMinutesOverride);
        }
        const revision = await getLatestContentsRevision(post, context);
        return revision?.wordCount ? normalizeValue(revision.wordCount / READ_WORDS_PER_MINUTE) : 1;
      },
      sqlResolver: ({ field, join }) =>
        join({
          table: "Revisions",
          type: "left",
          on: {
            _id: field("contents_latest"),
          },
          resolver: (revisionsField) => `GREATEST(1, ROUND(COALESCE(
        ${field("readTimeMinutesOverride")},
        ${revisionsField("wordCount")}
      ) / ${READ_WORDS_PER_MINUTE}))`,
        }),
    },
  },
  wordCount: {
    graphql: {
      outputType: "Int",
      canRead: ["guests"],
      resolver: async (post, _args, context) => {
        const revision = await getLatestContentsRevision(post, context);
        return revision?.wordCount ?? 0;
      },
      sqlResolver: ({ field, join }) =>
        join({
          table: "Revisions",
          type: "left",
          on: {
            _id: field("contents_latest"),
          },
          resolver: (revisionsField) => revisionsField("wordCount"),
        }),
    },
  },
  htmlBody: {
    graphql: {
      outputType: "String",
      canRead: [documentIsNotDeleted],
      resolver: async (post, _args, context) => {
        const revision = await getLatestContentsRevision(post, context);
        return revision?.html;
      },
      sqlResolver: ({ field, join }) =>
        join({
          table: "Revisions",
          type: "left",
          on: {
            _id: field("contents_latest"),
          },
          resolver: (revisionsField) => revisionsField("html"),
        }),
    },
  },
  submitToFrontpage: {
    database: {
      type: "BOOL",
      defaultValue: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members", "admins", "sunshineRegiment"],
      canCreate: ["members"],
      onCreate: ({ newDocument }) => {
        if (newDocument.isEvent) return false;
        if ("submitToFrontpage" in newDocument) return newDocument.submitToFrontpage;
        return true;
      },
      onUpdate: ({ data, document }) => {
        const updatedDocIsEvent = "isEvent" in document ? document.isEvent : false;
        if (updatedDocIsEvent) return false;
        return "submitToFrontpage" in document ? document.submitToFrontpage : true;
      },
      validation: {
        optional: true,
      },
    },
  },
  hiddenRelatedQuestion: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members", "admins", "sunshineRegiment"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  originalPostRelationSourceId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  sourcePostRelations: {
    graphql: {
      outputType: "[PostRelation!]!",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        if (!post.question) return [];
        const { currentUser, PostRelations } = context;
        const result = await PostRelations.find({
          targetPostId: post._id,
        }).fetch();
        return await accessFilterMultiple(currentUser, "PostRelations", result, context);
      },
    },
  },
  targetPostRelations: {
    graphql: {
      outputType: "[PostRelation!]!",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        if (!post.question) return [];
        const { currentUser, repos, PostRelations } = context;
        const postRelations = await repos.postRelations.getPostRelationsByPostId(post._id);
        if (!postRelations || postRelations.length < 1) return [];
        return await accessFilterMultiple(currentUser, "PostRelations", postRelations, context);
      },
    },
  },
  shortform: {
    database: {
      type: "BOOL",
      defaultValue: false,
      denormalized: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  canonicalSource: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  nominationCount2018: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Posts",
        fieldName: "nominationCount2018",
        foreignCollectionName: "Comments",
        foreignFieldName: "postId",
        filterFn: (comment) => !comment.deleted && comment.nominatedForReview === "2018",
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Comments",
        foreignFieldName: "postId",
        filterFn: (comment) => !comment.deleted && comment.nominatedForReview === "2018",
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  nominationCount2019: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Posts",
        fieldName: "nominationCount2019",
        foreignCollectionName: "Comments",
        foreignFieldName: "postId",
        filterFn: (comment) => !comment.deleted && comment.nominatedForReview === "2019",
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Comments",
        foreignFieldName: "postId",
        filterFn: (comment) => !comment.deleted && comment.nominatedForReview === "2019",
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  reviewCount2018: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Posts",
        fieldName: "reviewCount2018",
        foreignCollectionName: "Comments",
        foreignFieldName: "postId",
        filterFn: (comment) => !comment.deleted && comment.reviewingForReview === "2018",
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Comments",
        foreignFieldName: "postId",
        filterFn: (comment) => !comment.deleted && comment.reviewingForReview === "2018",
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  reviewCount2019: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Posts",
        fieldName: "reviewCount2019",
        foreignCollectionName: "Comments",
        foreignFieldName: "postId",
        filterFn: (comment) => !comment.deleted && comment.reviewingForReview === "2019",
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Comments",
        foreignFieldName: "postId",
        filterFn: (comment) => !comment.deleted && comment.reviewingForReview === "2019",
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  reviewCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Posts",
        fieldName: "reviewCount",
        foreignCollectionName: "Comments",
        foreignFieldName: "postId",
        filterFn: (comment) => !comment.deleted && !!comment.reviewingForReview,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Comments",
        foreignFieldName: "postId",
        filterFn: (comment) => !comment.deleted && !!comment.reviewingForReview,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  reviewVoteCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Posts",
        fieldName: "reviewVoteCount",
        foreignCollectionName: "ReviewVotes",
        foreignFieldName: "postId",
        filterFn: (doc) => true,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "ReviewVotes",
        foreignFieldName: "postId",
        filterFn: (doc) => true,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  positiveReviewVoteCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Posts",
        fieldName: "positiveReviewVoteCount",
        foreignCollectionName: "ReviewVotes",
        foreignFieldName: "postId",
        filterFn: (vote) => vote.qualitativeScore > DEFAULT_QUALITATIVE_VOTE || vote.quadraticScore > 0,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "ReviewVotes",
        foreignFieldName: "postId",
        filterFn: (vote) => vote.qualitativeScore > DEFAULT_QUALITATIVE_VOTE || vote.quadraticScore > 0,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  manifoldReviewMarketId: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: !isLWorAF,
      group: () => formGroups.adminOptions,
    },
  },
  annualReviewMarketProbability: {
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        if (!isLWorAF) {
          return 0;
        }
        const market = await getWithCustomLoader(context, "manifoldMarket", post._id, marketInfoLoader(context));
        return market?.probability;
      },
    },
  },
  annualReviewMarketIsResolved: {
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        if (!isLWorAF) {
          return false;
        }
        const market = await getWithCustomLoader(context, "manifoldMarket", post._id, marketInfoLoader(context));
        return market?.isResolved;
      },
    },
  },
  annualReviewMarketYear: {
    graphql: {
      outputType: "Int",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        if (!isLWorAF) {
          return 0;
        }
        const market = await getWithCustomLoader(context, "manifoldMarket", post._id, marketInfoLoader(context));
        return market?.year;
      },
    },
  },
  annualReviewMarketUrl: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        if (!isLWorAF) {
          return 0;
        }
        const market = await getWithCustomLoader(context, "manifoldMarket", post._id, marketInfoLoader(context));
        return market?.url;
      },
    },
  },
  glossary: {
    graphql: {
      outputType: "[JargonTerm!]!",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        // Forum-gating/beta-gating is done here, rather than just client side,
        // so that users don't have to download the glossary if it isn't going
        // to be displayed.
        if (!userCanViewJargonTerms(context.currentUser)) {
          return [];
        }
        const jargonTerms = await context.JargonTerms.find(
          {
            postId: post._id,
          },
          {
            sort: {
              term: 1,
            },
          }
        ).fetch();
        return await accessFilterMultiple(context.currentUser, "JargonTerms", jargonTerms, context);
      },
      sqlResolver: ({ field, currentUserField }) => `(
      SELECT ARRAY_AGG(ROW_TO_JSON(jt.*) ORDER BY jt."term" ASC)
      FROM "JargonTerms" jt
      WHERE jt."postId" = ${field("_id")}
      LIMIT 1
    )`,
    },
    form: {
      control: "GlossaryEditFormWrapper",
      hidden: ({ currentUser }) => !userCanCreateAndEditJargonTerms(currentUser),
      group: () => formGroups.glossary,
    },
  },
  reviewVoteScoreAF: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  reviewVotesAF: {
    database: {
      type: "DOUBLE PRECISION[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[Float]",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  reviewVoteScoreHighKarma: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  reviewVotesHighKarma: {
    database: {
      type: "DOUBLE PRECISION[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[Float]",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  reviewVoteScoreAllKarma: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  reviewVotesAllKarma: {
    database: {
      type: "DOUBLE PRECISION[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[Float]",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  finalReviewVoteScoreHighKarma: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  finalReviewVotesHighKarma: {
    database: {
      type: "DOUBLE PRECISION[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[Float]",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  finalReviewVoteScoreAllKarma: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  finalReviewVotesAllKarma: {
    database: {
      type: "DOUBLE PRECISION[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[Float]",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  finalReviewVoteScoreAF: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  finalReviewVotesAF: {
    database: {
      type: "DOUBLE PRECISION[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[Float]",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  lastCommentPromotedAt: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  tagRel: {
    graphql: {
      outputType: "TagRel",
      canRead: ["guests"],
      arguments: "tagId: String",
      resolver: async (post, args, context) => {
        const { tagId } = args;
        const { currentUser, TagRels } = context;
        const tagRels = await getWithLoader(
          context,
          TagRels,
          "tagRelByDocument",
          {
            tagId: tagId,
          },
          "postId",
          post._id
        );
        const filteredTagRels = await accessFilterMultiple(currentUser, "TagRels", tagRels, context);
        if (filteredTagRels?.length) {
          return filteredTagRels[0];
        }
      },
      sqlResolver: ({ field, resolverArg, join }) =>
        join({
          table: "TagRels",
          type: "left",
          on: {
            postId: field("_id"),
            tagId: resolverArg("tagId"),
          },
          resolver: (tagRelField) => tagRelField("*"),
        }),
    },
  },
  tags: {
    graphql: {
      outputType: "[Tag]",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        const { currentUser } = context;
        const tagRelevanceRecord = post.tagRelevance || {};
        const tagIds = Object.keys(tagRelevanceRecord).filter((id) => tagRelevanceRecord[id] > 0);
        const tags = (await loadByIds(context, "Tags", tagIds)).filter((tag) => !!tag);
        const tagInfo = tags.map((tag) => ({
          tag: tag,
          tagRel: {
            baseScore: tagRelevanceRecord[tag._id],
          },
        }));
        const sortedTagInfo = stableSortTags(tagInfo);
        const sortedTags = sortedTagInfo.map(({ tag }) => tag);
        return await accessFilterMultiple(currentUser, "Tags", sortedTags, context);
      },
    },
  },
  tagRelevance: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
    form: {
      control: "FormComponentPostEditorTagging",
      hidden: ({ eventForm, document }) => eventForm || (isLWorAF && !!document?.collabEditorDialogue),
      group: () => formGroups.tags,
    },
  },
  lastPromotedComment: {
    graphql: {
      outputType: "Comment",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        const { currentUser, Comments } = context;
        if (post.lastCommentPromotedAt) {
          const comment = await getWithCustomLoader(context, "lastPromotedComments", post._id, async (postIds) => {
            return await context.repos.comments.getPromotedCommentsOnPosts(postIds);
          });
          return await accessFilterSingle(currentUser, "Comments", comment, context);
        }
      },
    },
  },
  bestAnswer: {
    graphql: {
      outputType: "Comment",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        const { currentUser, Comments } = context;
        if (post.question) {
          if (post.lastCommentPromotedAt) {
            const comment = await Comments.findOne(
              {
                postId: post._id,
                answer: true,
                promoted: true,
              },
              {
                sort: {
                  promotedAt: -1,
                },
              }
            );
            return await accessFilterSingle(currentUser, "Comments", comment, context);
          } else {
            const comment = await Comments.findOne(
              {
                postId: post._id,
                answer: true,
                baseScore: {
                  $gt: 15,
                },
              },
              {
                sort: {
                  baseScore: -1,
                },
              }
            );
            return await accessFilterSingle(currentUser, "Comments", comment, context);
          }
        }
      },
    },
  },
  noIndex: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  rsvps: {
    database: {
      type: "JSONB[]",
    },
    graphql: {
      outputType: "[JSON]",
      canRead: ["guests"],
      validation: {
        simpleSchema: [rsvpType],
        optional: true,
      },
    },
  },
  rsvpCounts: {
    graphql: {
      outputType: "JSON!",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        return mapValues(
          groupBy(post.rsvps, (rsvp) => rsvp.response),
          (v) => v.length
        );
      },
    },
  },
  activateRSVPs: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Enable RSVPs for this event",
      tooltip: "RSVPs are public, but the associated email addresses are only visible to organizers.",
      control: "checkbox",
      hidden: hxjPay,
      group: () => formGroups.event,
    },
  },
  nextDayReminderSent: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  onlyVisibleToLoggedIn: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Hide this post from users who are not logged in",
      group: () => formGroups.adminOptions,
    },
  },
  onlyVisibleToEstablishedAccounts: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Hide this post from logged out users and newly created accounts",
      group: () => formGroups.adminOptions,
    },
  },
  hideFromRecentDiscussions: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Hide this post from recent discussions",
      control: "checkbox",
      group: () => formGroups.adminOptions,
    },
  },
  currentUserReviewVote: {
    graphql: {
      outputType: "ReviewVote",
      canRead: ["members"],
      resolver: async (post, args, context) => {
        if (!isLWorAF) {
          return null;
        }
        const { ReviewVotes, currentUser } = context;
        if (!currentUser) return null;
        const votes = await getWithLoader(
          context,
          ReviewVotes,
          `reviewVotesByUser${currentUser._id}`,
          {
            userId: currentUser._id,
          },
          "postId",
          post._id
        );
        if (!votes.length) return null;
        const vote = await accessFilterSingle(currentUser, "ReviewVotes", votes[0], context);
        return vote;
      },
      sqlResolver: ({ field, currentUserField, join }) =>
        join({
          table: "ReviewVotes",
          type: "left",
          on: {
            postId: field("_id"),
            userId: currentUserField("_id"),
          },
          resolver: (reviewVotesField) => reviewVotesField("*"),
        }),
    },
  },
  reviewWinner: {
    graphql: {
      outputType: "ReviewWinner",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        if (!isLWorAF) {
          return null;
        }
        const { currentUser } = context;
        const winner = await getPostReviewWinnerInfo(post._id, context);
        return accessFilterSingle(currentUser, "ReviewWinners", winner, context);
      },
    },
  },
  spotlight: {
    graphql: {
      outputType: "Spotlight",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        const { currentUser, Spotlights } = context;
        const spotlight = await getWithLoader(
          context,
          Spotlights,
          "postSpotlight",
          {
            documentId: post._id,
            draft: false,
            deletedDraft: false,
          },
          "documentId",
          post._id
        );
        return accessFilterSingle(currentUser, "Spotlights", spotlight[0], context);
      },
      sqlResolver: ({ field, join }) =>
        join({
          table: "Spotlights",
          type: "left",
          on: {
            documentId: field("_id"),
            draft: "false",
            deletedDraft: "false",
          },
          resolver: (spotlightsField) => spotlightsField("*"),
        }),
    },
  },
  votingSystem: {
    database: {
      type: "TEXT",
      defaultValue: "twoAxis",
      canAutofillDefault: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      onCreate: ({ document }) => document.votingSystem ?? getDefaultVotingSystem(),
      validation: {
        optional: true,
      },
    },
    form: {
      form: {
        options: ({ currentUser }) => {
          const votingSystems = getVotingSystems();
          const filteredVotingSystems = currentUser.isAdmin
            ? votingSystems
            : votingSystems.filter((votingSystem) => votingSystem.userCanActivate);
          return filteredVotingSystems.map((votingSystem) => ({
            label: votingSystem.description,
            value: votingSystem.name,
          }));
        },
      },
      control: "select",
      group: () => formGroups.adminOptions,
    },
  },
  myEditorAccess: {
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        // We need access to the linkSharingKey field here, which the user (of course) does not have access to.
        // Since the post at this point is already filtered by fields that this user has access, we have to grab
        // an unfiltered version of the post from cache
        const unfilteredPost = await context.loaders["Posts"].load(post._id);
        return getCollaborativeEditorAccess({
          formType: "edit",
          post: unfilteredPost,
          user: context.currentUser,
          context,
          useAdminPowers: false,
        });
      },
    },
  },
  podcastEpisodeId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "PodcastEpisodes",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "podcasters"],
      canCreate: ["admins", "podcasters"],
      validation: {
        optional: true,
      },
    },
    form: {
      control: "PodcastEpisodeInput",
      group: () => formGroups.audio,
    },
  },
  podcastEpisode: {
    graphql: {
      outputType: "PodcastEpisode",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "PodcastEpisodes", fieldName: "podcastEpisodeId" }),
      sqlResolver: getForeignKeySqlResolver({
        collectionName: "Posts",
        nullable: true,
        idFieldName: "podcastEpisodeId",
      }),
    },
  },
  forceAllowType3Audio: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 13,
      control: "checkbox",
      hidden: false,
      group: () => formGroups.adminOptions,
    },
  },
  legacy: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 12,
      control: "checkbox",
      hidden: false,
      group: () => formGroups.adminOptions,
    },
  },
  legacyId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  legacySpam: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  feedId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "RSSFeeds",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  feed: {
    graphql: {
      outputType: "RSSFeed",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "RSSFeeds", fieldName: "feedId" }),
    },
  },
  feedLink: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  lastVisitedAt: {
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        const lastReadStatus = await getLastReadStatus(post, context);
        return lastReadStatus?.lastUpdated;
      },
      sqlResolver: ({ field, currentUserField, join }) =>
        join({
          table: "ReadStatuses",
          type: "left",
          on: {
            postId: field("_id"),
            userId: currentUserField("_id"),
          },
          resolver: (readStatusField) => `${readStatusField("lastUpdated")}`,
        }),
    },
  },
  isRead: {
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        const lastReadStatus = await getLastReadStatus(post, context);
        return lastReadStatus?.isRead;
      },
      sqlResolver: ({ field, currentUserField, join }) =>
        join({
          table: "ReadStatuses",
          type: "left",
          on: {
            postId: field("_id"),
            userId: currentUserField("_id"),
          },
          resolver: (readStatusField) => `${readStatusField("isRead")} IS TRUE`,
        }),
    },
  },
  curatedDate: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: isEAForum ? ['admins'] : ['sunshineRegiment', 'admins'],
      canCreate: isEAForum ? ['admins'] : ['sunshineRegiment', 'admins'],
      validation: {
        optional: true,
      },
    },
    form: {
      control: "datetime",
      group: () => formGroups.adminOptions,
    },
  },
  metaDate: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      control: "datetime",
      group: () => formGroups.adminOptions,
    },
  },
  suggestForCuratedUserIds: {
    database: {
      type: "VARCHAR(27)[]",
    },
    graphql: {
      outputType: "[String]",
      canRead: ["members"],
      canUpdate: ["sunshineRegiment", "admins", "canSuggestCuration"],
      canCreate: ["sunshineRegiment", "admins", "canSuggestCuration"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Suggested for Curated by",
      control: "FormUserMultiselect",
      group: () => formGroups.adminOptions,
    },
  },
  suggestForCuratedUsernames: {
    graphql: {
      outputType: "String",
      canRead: ["members"],
      resolver: async (post, args, context) => {
        // TODO - Turn this into a proper resolve field.
        // Ran into weird issue trying to get this to be a proper "users"
        // resolve field. Wasn't sure it actually needed to be anyway,
        // did a hacky thing.
        if (!post.suggestForCuratedUserIds) return null;
        const users = await Promise.all(
          _.map(post.suggestForCuratedUserIds, async (userId) => {
            const user = await context.loaders.Users.load(userId);
            return user.displayName;
          })
        );
        if (users.length) {
          return users.join(", ");
        } else {
          return null;
        }
      },
      sqlResolver: ({ field }) => `(
        SELECT ARRAY_AGG(u."displayName")
        FROM UNNEST(${field("suggestForCuratedUserIds")}) AS "ids"
        JOIN "Users" u ON u."_id" = "ids"
      )`,
    },
  },
  frontpageDate: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["members"],
      ...(!requireReviewToFrontpagePostsSetting.get() && {
        onCreate: ({ document: { isEvent, submitToFrontpage, draft } }) => eaFrontpageDateDefault(
          isEvent,
          submitToFrontpage,
          draft,
        ),
        onUpdate: ({ data, oldDocument }) => {
          if (oldDocument.draft && data.draft === false && !oldDocument.frontpageDate) {
            return eaFrontpageDateDefault(
              data.isEvent ?? oldDocument.isEvent,
              data.submitToFrontpage ?? oldDocument.submitToFrontpage,
              false,
            );
          }
          // Setting frontpageDate to null is a special case that means "move to personal blog",
          // if frontpageDate is actually undefined then we want to use the old value.
          return data.frontpageDate === undefined ? oldDocument.frontpageDate : data.frontpageDate;
        },
      }),
      validation: {
        optional: true,
      },
    },
  },
  autoFrontpage: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["sunshineRegiment", "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        allowedValues: ["show", "hide"],
        optional: true,
      },
    },
  },
  collectionTitle: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.canonicalSequence,
    },
  },
  coauthorStatuses: {
    database: {
      type: "JSONB[]",
      nullable: true,
    },
    graphql: {
      outputType: "[JSON]",
      canRead: [documentIsNotDeleted],
      canUpdate: ["sunshineRegiment", "admins", userOverNKarmaOrApproved(MINIMUM_COAUTHOR_KARMA)],
      canCreate: ["sunshineRegiment", "admins", userOverNKarmaOrApproved(MINIMUM_COAUTHOR_KARMA)],
      validation: {
        simpleSchema: [coauthorStatusSchema],
        optional: true,
      },
    },
    form: {
      label: "Co-Authors",
      control: "CoauthorsListEditor",
      group: () => formGroups.coauthors,
    },
  },
  coauthors: {
    graphql: {
      outputType: "[User!]",
      canRead: [documentIsNotDeleted],
      resolver: async (post, args, context) => {
        const resolvedDocs = await loadByIds(
          context,
          "Users",
          post.coauthorStatuses?.map(({ userId }) => userId) || []
        );
        return await accessFilterMultiple(context.currentUser, "Users", resolvedDocs, context);
      },
    },
  },
  hasCoauthorPermission: {
    database: {
      type: "BOOL",
      defaultValue: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  socialPreviewImageId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      label: "Social Preview Image",
      group: () => formGroups.socialPreview,
      order: 4,
    }
  },
  socialPreviewImageAutoUrl: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  socialPreview: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
      validation: {
        simpleSchema: socialPreviewSchema,
        optional: true,
      },
    },
    form: {
      order: 4,
      label: "Social Preview Image",
      control: "SocialPreviewUpload",
      hidden: ({ document }) => (isLWorAF && !!document?.collabEditorDialogue) || (isEAForum && !!document?.isEvent),
      group: () => formGroups.socialPreview,
    },
  },
  socialPreviewData: {
    graphql: {
      outputType: "SocialPreviewType",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        const { imageId, text } = post.socialPreview || {};
        const imageUrl = getSocialPreviewImage(post);
        return {
          _id: post._id,
          imageId,
          imageUrl,
          text,
        };
      },
    },
  },
  fmCrosspost: {
    database: {
      type: "JSONB",
      defaultValue: { isCrosspost: false },
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [documentIsNotDeleted],
      canUpdate: [allOf(userOwns, userPassesCrosspostingKarmaThreshold), "admins"],
      canCreate: [userPassesCrosspostingKarmaThreshold, "admins"],
      onCreate: (args) => {
        const { document, context } = args;
        // If we're handling a request from our peer site, then we have just set
        // the foreignPostId ourselves
        if (document.fmCrosspost?.foreignPostId && !context.isFMCrosspostRequest) {
          throw new Error("Cannot set the foreign post ID of a crosspost");
        }
        return schemaDefaultValueFmCrosspost.onCreate?.(args);
      },
      onUpdate: (args) => {
        const { data, oldDocument } = args;
        if (
          data.fmCrosspost?.foreignPostId &&
          data.fmCrosspost.foreignPostId !== oldDocument.fmCrosspost?.foreignPostId
        ) {
          throw new Error("Cannot change the foreign post ID of a crosspost");
        }
        return schemaDefaultValueFmCrosspost.onUpdate?.(args);
      },
      validation: {
        simpleSchema: crosspostSchema,
        optional: true,
      },
    },
    form: {
      order: 3,
      control: "FMCrosspostControl",
      hidden: (props) => !fmCrosspostSiteNameSetting.get() || props.eventForm,
      group: () => formGroups.advancedOptions,
      tooltip: fmCrosspostBaseUrlSetting.get()?.includes("forum.effectivealtruism.org") ?
        "The EA Forum is for discussions that are relevant to doing good effectively. If you're not sure what this means, consider exploring the Forum's Frontpage before posting on it." :
        undefined,
    },
  },
  canonicalSequenceId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Sequences",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      control: "text",
      hidden: false,
      group: () => formGroups.canonicalSequence,
    },
  },
  canonicalSequence: {
    graphql: {
      outputType: "Sequence",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Sequences", fieldName: "canonicalSequenceId" }),
    },
  },
  canonicalCollectionSlug: {
    database: {
      type: "TEXT",
      foreignKey: { collection: "Collections", field: "slug" },
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      control: "text",
      hidden: false,
      group: () => formGroups.canonicalSequence,
    },
  },
  canonicalCollection: {
    graphql: {
      outputType: "Collection",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        if (!post.canonicalCollectionSlug) return null;
        const collection = await context.Collections.findOne({
          slug: post.canonicalCollectionSlug,
        });
        return await accessFilterSingle(context.currentUser, "Collections", collection, context);
      },
    },
  },
  canonicalBookId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Books",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      control: "text",
      hidden: false,
      group: () => formGroups.canonicalSequence,
    },
  },
  canonicalBook: {
    graphql: {
      outputType: "Book",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Books", fieldName: "canonicalBookId" }),
    },
  },
  canonicalNextPostSlug: {
    database: {
      type: "TEXT",
      foreignKey: { collection: "Posts", field: "slug" },
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      control: "text",
      hidden: false,
      group: () => formGroups.canonicalSequence,
    },
  },
  canonicalPrevPostSlug: {
    database: {
      type: "TEXT",
      foreignKey: { collection: "Posts", field: "slug" },
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      control: "text",
      hidden: false,
      group: () => formGroups.canonicalSequence,
    },
  },
  nextPost: {
    graphql: {
      outputType: "Post",
      canRead: ["guests"],
      arguments: "sequenceId: String",
      resolver: async (post, args, context) => {
        const { sequenceId } = args;
        const { currentUser, Posts } = context;
        if (sequenceId) {
          const nextPostID = await sequenceGetNextPostID(sequenceId, post._id, context);
          if (nextPostID) {
            const nextPost = await context.loaders.Posts.load(nextPostID);
            return accessFilterSingle(currentUser, "Posts", nextPost, context);
          } else {
            const nextSequencePostIdTuple = await getNextPostIdFromNextSequence(sequenceId, post._id, context);
            if (!nextSequencePostIdTuple) {
              return null;
            }
            const nextPost = await context.loaders.Posts.load(nextSequencePostIdTuple.postId);
            return accessFilterSingle(currentUser, "Posts", nextPost, context);
          }
        }
        if (post.canonicalSequenceId) {
          const nextPostID = await sequenceGetNextPostID(post.canonicalSequenceId, post._id, context);
          if (nextPostID) {
            const nextPost = await context.loaders.Posts.load(nextPostID);
            const nextPostFiltered = await accessFilterSingle(currentUser, "Posts", nextPost, context);
            if (nextPostFiltered) return nextPostFiltered;
          }
        }
        if (post.canonicalNextPostSlug) {
          const nextPost = await Posts.findOne({
            slug: post.canonicalNextPostSlug,
          });
          const nextPostFiltered = await accessFilterSingle(currentUser, "Posts", nextPost, context);
          if (nextPostFiltered) return nextPostFiltered;
        }
        return null;
      },
    },
  },
  prevPost: {
    graphql: {
      outputType: "Post",
      canRead: ["guests"],
      arguments: "sequenceId: String",
      resolver: async (post, args, context) => {
        const { sequenceId } = args;
        const { currentUser, Posts } = context;
        if (sequenceId) {
          const prevPostID = await sequenceGetPrevPostID(sequenceId, post._id, context);
          if (prevPostID) {
            const prevPost = await context.loaders.Posts.load(prevPostID);
            return accessFilterSingle(currentUser, "Posts", prevPost, context);
          } else {
            const prevSequencePostIdTuple = await getPrevPostIdFromPrevSequence(sequenceId, post._id, context);
            if (!prevSequencePostIdTuple) {
              return null;
            }
            const prevPost = await context.loaders.Posts.load(prevSequencePostIdTuple.postId);
            return accessFilterSingle(currentUser, "Posts", prevPost, context);
          }
        }
        if (post.canonicalSequenceId) {
          const prevPostID = await sequenceGetPrevPostID(post.canonicalSequenceId, post._id, context);
          if (prevPostID) {
            const prevPost = await context.loaders.Posts.load(prevPostID);
            const prevPostFiltered = await accessFilterSingle(currentUser, "Posts", prevPost, context);
            if (prevPostFiltered) {
              return prevPostFiltered;
            }
          }
        }
        if (post.canonicalPrevPostSlug) {
          const prevPost = await Posts.findOne({
            slug: post.canonicalPrevPostSlug,
          });
          const prevPostFiltered = await accessFilterSingle(currentUser, "Posts", prevPost, context);
          if (prevPostFiltered) {
            return prevPostFiltered;
          }
        }
        return null;
      },
    },
  },
  sequence: {
    graphql: {
      outputType: "Sequence",
      canRead: ["guests"],
      arguments: "sequenceId: String, prevOrNext: String",
      resolver: async (post, args, context) => {
        const { sequenceId, prevOrNext } = args;
        const { currentUser } = context;
        let sequence = null;
        if (sequenceId && (await sequenceContainsPost(sequenceId, post._id, context))) {
          sequence = await context.loaders.Sequences.load(sequenceId);
        } else if (sequenceId && prevOrNext) {
          const sequencePostIdTuple =
            prevOrNext === "prev"
              ? await getPrevPostIdFromPrevSequence(sequenceId, post._id, context)
              : await getNextPostIdFromNextSequence(sequenceId, post._id, context);
          if (sequencePostIdTuple) {
            sequence = await context.loaders.Sequences.load(sequencePostIdTuple.sequenceId);
          }
        } else if (!sequence && post.canonicalSequenceId) {
          sequence = await context.loaders.Sequences.load(post.canonicalSequenceId);
        }
        return await accessFilterSingle(currentUser, "Sequences", sequence, context);
      },
    },
  },
  unlisted: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 11,
      label: "Make only accessible via link",
      control: "checkbox",
      group: () => formGroups.adminOptions,
    },
  },
  disableRecommendation: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 12,
      label: "Exclude from Recommendations",
      control: "checkbox",
      group: () => formGroups.adminOptions,
    },
  },
  defaultRecommendation: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 13,
      label: "Include in default recommendations",
      control: "checkbox",
      group: () => formGroups.adminOptions,
    },
  },
  hideFromPopularComments: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["admins", "sunshineRegiment"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 14,
      label: "Hide comments on this post from Popular Comments",
      control: "checkbox",
      hidden: !isEAForum,
      group: () => formGroups.adminOptions,
    },
  },
  draft: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["members"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      label: "Save to Drafts",
    },
  },
  wasEverUndrafted: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["members"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  meta: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      label: "Publish to meta",
      control: "checkbox",
    },
  },
  hideFrontpageComments: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      control: "checkbox",
      group: () => formGroups.moderationGroup,
    },
  },
  maxBaseScore: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      onCreate: ({ document }) => document.baseScore ?? 0,
      validation: {
        optional: true,
      },
    },
  },
  scoreExceeded2Date: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: ({ document }) => (document.baseScore >= 2 ? new Date() : null),
      validation: {
        optional: true,
      },
    },
  },
  scoreExceeded30Date: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: ({ document }) => (document.baseScore >= 30 ? new Date() : null),
      validation: {
        optional: true,
      },
    },
  },
  scoreExceeded45Date: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: ({ document }) => (document.baseScore >= 45 ? new Date() : null),
      validation: {
        optional: true,
      },
    },
  },
  scoreExceeded75Date: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: ({ document }) => (document.baseScore >= 75 ? new Date() : null),
      validation: {
        optional: true,
      },
    },
  },
  scoreExceeded125Date: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: ({ document }) => (document.baseScore >= 125 ? new Date() : null),
      validation: {
        optional: true,
      },
    },
  },
  scoreExceeded200Date: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: ({ document }) => (document.baseScore >= 200 ? new Date() : null),
      validation: {
        optional: true,
      },
    },
  },
  bannedUserIds: {
    database: {
      type: "VARCHAR(27)[]",
    },
    graphql: {
      outputType: "[String]",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: [userCanModeratePost],
      validation: {
        optional: true,
      },
    },
  },
  commentsLocked: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: (currentUser, document) => userCanCommentLock(currentUser, document),
      canCreate: (currentUser) => userCanCommentLock(currentUser, null),
      validation: {
        optional: true,
      },
    },
    form: {
      control: "checkbox",
      group: () => formGroups.moderationGroup,
    },
  },
  commentsLockedToAccountsCreatedAfter: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: (currentUser, document) => userCanCommentLock(currentUser, document),
      canCreate: (currentUser) => userCanCommentLock(currentUser, null),
      validation: {
        optional: true,
      },
    },
    form: {
      control: "datetime",
      group: () => formGroups.moderationGroup,
    },
  },
  organizerIds: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[String]",
      canRead: [documentIsNotDeleted],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: arrayOfForeignKeysOnCreate,
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      control: "FormUserMultiselect",
      group: () => formGroups.event,
    },
  },
  organizers: {
    graphql: {
      outputType: "[User!]!",
      canRead: [documentIsNotDeleted],
      resolver: generateIdResolverMulti({ foreignCollectionName: "Users", fieldName: "organizerIds" }),
    },
  },
  groupId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Localgroups",
    },
    graphql: {
      outputType: "String",
      canRead: [documentIsNotDeleted],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 1,
      label: "Group",
      control: "SelectLocalgroup",
      hidden: hxjPay,
      group: () => formGroups.event,
    },
  },
  group: {
    graphql: {
      outputType: "Localgroup",
      canRead: [documentIsNotDeleted],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Localgroups", fieldName: "groupId" }),
    },
  },
  eventType: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      form: { options: () => EVENT_TYPES },
      order: 2,
      label: "Event Format",
      control: "select",
      hidden: (props) => !props.eventForm || isLWorAF,
      group: () => formGroups.event,
    },
  },
  isEvent: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["members"],
      onCreate: ({ newDocument }) => {
        // HACK: This replaces the `onCreate` that normally comes with
        // `schemaDefaultValue`. In addition to enforcing that the field must
        // be present (not undefined), it also enforces that it cannot be null.
        // There is a bug where GreaterWrong somehow submits posts with isEvent
        // set to null (instead of false), which causes some post-views to filter
        // it out (because they filter for non-events using isEvent:false which
        // does not match null).
        if (newDocument.isEvent === undefined || newDocument.isEvent === null) return false;
        else return undefined;
      },
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      group: () => formGroups.event,
    }
  },
  reviewedByUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  reviewedByUser: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "reviewedByUserId" }),
    },
  },
  reviewForCuratedUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: isEAForum ? ['admins'] : ['sunshineRegiment', 'admins'],
      canCreate: isEAForum ? ['admins'] : ['sunshineRegiment', 'admins'],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Curated Review UserId",
      group: () => formGroups.adminOptions,
    },
  },
  startTime: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Start Time",
      tooltip: "For courses/programs, this is the application deadline.",
      control: "datetime",
      hidden: hxjPay,
      group: () => formGroups.event,
    },
  },
  localStartTime: {
    database: {
      type: "TIMESTAMPTZ",
      denormalized: true,
      canAutoDenormalize: true,
      needsUpdate: hQrRp7,
      getValue: hjM6A7,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: getDenormalizedFieldOnCreate<"Posts">({ getValue: hjM6A7, needsUpdate: hQrRp7 }),
      onUpdate: getDenormalizedFieldOnUpdate<"Posts">({ getValue: hjM6A7, needsUpdate: hQrRp7 }),
      validation: {
        optional: true,
      },
    },
  },
  endTime: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "End Time",
      control: "datetime",
      hidden: (props) => shouldHideEndTime(props),
      group: () => formGroups.event,
    },
  },
  localEndTime: {
    database: {
      type: "TIMESTAMPTZ",
      denormalized: true,
      canAutoDenormalize: true,
      needsUpdate: hKNgTF,
      getValue: haJvcc,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: getDenormalizedFieldOnCreate<"Posts">({ getValue: haJvcc, needsUpdate: hKNgTF }),
      onUpdate: getDenormalizedFieldOnUpdate<"Posts">({ getValue: haJvcc, needsUpdate: hKNgTF }),
      validation: {
        optional: true,
      },
    },
  },
  eventRegistrationLink: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        regEx: SimpleSchema.RegEx.Url,
        optional: true,
      },
    },
    form: {
      label: "Event Registration Link",
      tooltip: "https://...",
      control: "MuiTextField",
      hidden: hxjPay,
      group: () => formGroups.event,
    },
  },
  joinEventLink: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        regEx: SimpleSchema.RegEx.Url,
        optional: true,
      },
    },
    form: {
      label: "Join Online Event Link",
      tooltip: "https://...",
      control: "MuiTextField",
      hidden: hxjPay,
      group: () => formGroups.event,
    },
  },
  onlineEvent: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 0,
      hidden: hxjPay,
      group: () => formGroups.event,
    },
  },
  globalEvent: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "This event is intended for a global audience",
      tooltip:
        "By default, events are only advertised to people who are located nearby (for both in-person and online events). Check this to advertise it people located anywhere.",
      hidden: hxjPay,
      group: () => formGroups.event,
    },
  },
  mongoLocation: {
    database: {
      type: "JSONB",
      denormalized: true,
      canAutoDenormalize: true,
      needsUpdate: h9LCpv,
      getValue: hEpEiL,
    },
    graphql: {
      outputType: "JSON",
      canRead: [documentIsNotDeleted],
      onCreate: getDenormalizedFieldOnCreate<"Posts">({ getValue: hEpEiL, needsUpdate: h9LCpv }),
      onUpdate: getDenormalizedFieldOnUpdate<"Posts">({ getValue: hEpEiL, needsUpdate: h9LCpv }),
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  googleLocation: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: [documentIsNotDeleted],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
    form: {
      form: { stringVersionFieldName: "location" },
      label: "Event Location",
      control: "LocationFormComponent",
      hidden: hxjPay,
      group: () => formGroups.event,
    },
  },
  location: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [documentIsNotDeleted],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  contactInfo: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [documentIsNotDeleted],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Contact Info",
      control: "MuiTextField",
      hidden: hxjPay,
      group: () => formGroups.event,
    },
  },
  facebookLink: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [documentIsNotDeleted],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        regEx: SimpleSchema.RegEx.Url,
        optional: true,
      },
    },
    form: {
      label: "Facebook Event",
      tooltip: "https://www.facebook.com/events/...",
      control: "MuiTextField",
      hidden: hxjPay,
      group: () => formGroups.event,
    },
  },
  meetupLink: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [documentIsNotDeleted],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        regEx: SimpleSchema.RegEx.Url,
        optional: true,
      },
    },
    form: {
      label: "Meetup.com Event",
      tooltip: "https://www.meetup.com/...",
      control: "MuiTextField",
      hidden: hxjPay,
      group: () => formGroups.event,
    },
  },
  website: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [documentIsNotDeleted],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        regEx: SimpleSchema.RegEx.Url,
        optional: true,
      },
    },
    form: {
      tooltip: "https://...",
      control: "MuiTextField",
      hidden: hxjPay,
      group: () => formGroups.event,
    },
  },
  eventImageId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [documentIsNotDeleted],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Event Image",
      tooltip: "Recommend 1920x1005 px, 1.91:1 aspect ratio (same as Facebook)",
      control: "ImageUpload",
      hidden: (props) => !props.eventForm || !isEAForum,
      group: () => formGroups.event,
    },
  },
  types: {
    database: {
      type: "TEXT[]",
    },
    graphql: {
      outputType: "[String]",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      form: { options: () => localGroupTypeFormOptions },
      label: "Group Type:",
      control: "MultiSelectButtons",
      hidden: (props) => !isLWorAF || !props.eventForm,
      group: () => formGroups.event,
    },
  },
  metaSticky: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      onCreate: ({ document: post }) => {
        if (!post.metaSticky) {
          return false;
        }
      },
      onUpdate: ({ modifier }) => {
        if (!modifier.$set.metaSticky) {
          return false;
        }
      },
      validation: {
        optional: true,
      },
    },
    form: {
      order: 10,
      label: "Sticky (Meta)",
      control: "checkbox",
      group: () => formGroups.adminOptions,
    },
  },
  sharingSettings: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
    form: {
      order: 15,
      label: "Sharing Settings",
      control: "PostSharingSettings",
      hidden: (props) => !!props.debateForm,
      group: () => formGroups.category,
    },
  },
  shareWithUsers: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[String]",
      canRead: [documentIsNotDeleted],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: arrayOfForeignKeysOnCreate,
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      order: 15,
    },
  },
  usersSharedWith: {
    graphql: {
      outputType: "[User!]!",
      canRead: [documentIsNotDeleted],
      resolver: generateIdResolverMulti({ foreignCollectionName: "Users", fieldName: "shareWithUsers" }),
    },
  },
  linkSharingKey: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userIsSharedOn, userOwns, "admins"],
      canUpdate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  linkSharingKeyUsedBy: {
    database: {
      type: "VARCHAR(27)[]",
    },
    graphql: {
      outputType: "[String]",
      canRead: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  commentSortOrder: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  hideAuthor: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  tableOfContents: {
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        try {
          return await getToCforPost({
            document,
            version: null,
            context,
          });
        } catch (e) {
          captureException(e);
          return null;
        }
      },
    },
  },
  tableOfContentsRevision: {
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      arguments: "version: String",
      resolver: async (document, args, context) => {
        const { version = null } = args;
        try {
          return await getToCforPost({
            document,
            version,
            context,
          });
        } catch (e) {
          captureException(e);
          return null;
        }
      },
    },
  },
  sideComments: {
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      resolver: async (post, _args, context) => {
        const { SideCommentCaches } = context;
        if (!hasSideComments || isNotHostedHere(post)) {
          return null;
        }
        // If the post was fetched with a SQL resolver then we will already
        // have the side comments cache available (even though the type system
        // doesn't know about it), otherwise we have to fetch it from the DB.
        const sqlFetchedPost = post;
        // `undefined` means we didn't run a SQL resolver. `null` means we ran
        // a SQL resolver, but no relevant cache record was found.
        const cache =
          sqlFetchedPost.sideCommentsCache === undefined
            ? await SideCommentCaches.findOne({
                postId: post._id,
                version: sideCommentCacheVersion,
              })
            : sqlFetchedPost.sideCommentsCache;
        const cachedAt = new Date(cache?.createdAt ?? 0);
        const editedAt = new Date(post.modifiedAt ?? 0);
        const cacheIsValid = cache && (!post.lastCommentedAt || cachedAt > post.lastCommentedAt) && cachedAt > editedAt;
        const comments = await Comments.find(
          {
            ...getDefaultViewSelector("Comments"),
            postId: post._id,
            ...(cacheIsValid && {
              _id: {
                $in: Object.values(cache.commentsByBlock).flat(),
              },
            }),
          },
          {
            projection: {
              userId: 1,
              baseScore: 1,
              contents: cacheIsValid ? 0 : 1,
            },
          }
        ).fetch();
        let unfilteredResult = null;
        if (cacheIsValid) {
          unfilteredResult = {
            annotatedHtml: cache.annotatedHtml,
            commentsByBlock: cache.commentsByBlock,
          };
        } else {
          const toc = await getToCforPost({
            document: post,
            version: null,
            context,
          });
          const html = toc?.html || (await getPostHTML(post, context));
          const sideCommentMatches = matchSideComments({
            html: html ?? "",
            comments: comments.map((comment) => ({
              _id: comment._id,
              html: comment.contents?.html ?? "",
            })),
          });
          void context.repos.sideComments.saveSideCommentCache(
            post._id,
            sideCommentMatches.html,
            sideCommentMatches.sideCommentsByBlock
          );
          unfilteredResult = {
            annotatedHtml: sideCommentMatches.html,
            commentsByBlock: sideCommentMatches.sideCommentsByBlock,
          };
        }
        const alwaysShownIds = new Set([]);
        alwaysShownIds.add(post.userId);
        if (post.coauthorStatuses) {
          for (let { userId } of post.coauthorStatuses) {
            alwaysShownIds.add(userId);
          }
        }
        const commentsById = keyBy(comments, (comment) => comment._id);
        let highKarmaCommentsByBlock = {};
        let nonnegativeKarmaCommentsByBlock = {};
        for (let blockID of Object.keys(unfilteredResult.commentsByBlock)) {
          const commentIdsHere = unfilteredResult.commentsByBlock[blockID];
          const highKarmaCommentIdsHere = commentIdsHere.filter((commentId) => {
            const comment = commentsById[commentId];
            if (!comment) return false;
            else if (comment.baseScore >= sideCommentFilterMinKarma) return true;
            else if (alwaysShownIds.has(comment.userId)) return true;
            else return false;
          });
          if (highKarmaCommentIdsHere.length > 0) {
            highKarmaCommentsByBlock[blockID] = highKarmaCommentIdsHere;
          }
          const nonnegativeKarmaCommentIdsHere = commentIdsHere.filter((commentId) => {
            const comment = commentsById[commentId];
            if (!comment) return false;
            else if (alwaysShownIds.has(comment.userId)) return true;
            else if (comment.baseScore <= sideCommentAlwaysExcludeKarma) return false;
            else return true;
          });
          if (nonnegativeKarmaCommentIdsHere.length > 0) {
            nonnegativeKarmaCommentsByBlock[blockID] = nonnegativeKarmaCommentIdsHere;
          }
        }
        return {
          html: unfilteredResult.annotatedHtml,
          commentsByBlock: nonnegativeKarmaCommentsByBlock,
          highKarmaCommentsByBlock: highKarmaCommentsByBlock,
        };
      },
    },
  },
  sideCommentsCache: {
    graphql: {
      outputType: "SideCommentCache",
      canRead: ["guests"],
      resolver: ({ _id }, _, context) => {
        const { SideCommentCaches } = context;
        if (!hasSideComments) {
          return null;
        }
        return SideCommentCaches.findOne({
          postId: _id,
          version: sideCommentCacheVersion,
        });
      },
      ...(hasSideComments && {
        sqlResolver: ({field, join}) => join({
          table: "SideCommentCaches",
          type: "left",
          on: {
            postId: field("_id"),
            version: `${sideCommentCacheVersion}`,
          },
          resolver: (sideCommentsField) => sideCommentsField("*"),
        }),
        sqlPostProcess: () => null,
      }),
    },
  },
  sideCommentVisibility: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
    form: {
      hidden: true,
      label: "Replies in sidebar",
      group: () => formGroups.advancedOptions,
      control: "select",
      form: {
        options: () => {
          return [
            {value: "highKarma", label: "10+ karma (default)"},
            {value: "hidden", label: "Hide all"},
          ];
        }
      }
    },
  },
  disableSidenotes: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: !hasSidenotes,
      group: () => formGroups.advancedOptions,
    },
  },
  moderationStyle: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
    form: {
      form: {
        options: function () {
          return [
            {
              value: "",
              label: "No Moderation",
            },
            {
              value: "easy-going",
              label: "Easy Going - I just delete obvious spam and trolling.",
            },
            {
              value: "norm-enforcing",
              label: "Norm Enforcing - I try to enforce particular rules (see below)",
            },
            {
              value: "reign-of-terror",
              label: "Reign of Terror - I delete anything I judge to be annoying or counterproductive",
            },
          ];
        },
      },
      order: 55,
      label: "Style",
      control: "select",
      hidden: ({ document }) => isFriendlyUI || !!document?.collabEditorDialogue,
      group: () => formGroups.moderationGroup,
    },
  },
  ignoreRateLimits: {
    database: {
      type: "BOOL",
      nullable: true,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 60,
      tooltip: "Allow rate-limited users to comment freely on this post",
      hidden: ({ document }) => isEAForum || !!document?.collabEditorDialogue,
      group: () => formGroups.moderationGroup,
    },
  },
  hideCommentKarma: {
    database: {
      type: "BOOL",
      defaultValue: false,
      denormalized: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", postCanEditHideCommentKarma],
      canCreate: ["admins", postCanEditHideCommentKarma],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: !isEAForum,
      group: () => formGroups.moderationGroup,
    },
  },
  commentCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Posts",
        fieldName: "commentCount",
        foreignCollectionName: "Comments",
        foreignFieldName: "postId",
        filterFn: (comment) =>
          !comment.deleted && !comment.rejected && !comment.debateResponse && !comment.authorIsUnreviewed,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Comments",
        foreignFieldName: "postId",
        filterFn: (comment) =>
          !comment.deleted && !comment.rejected && !comment.debateResponse && !comment.authorIsUnreviewed,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  topLevelCommentCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Posts",
        fieldName: "topLevelCommentCount",
        foreignCollectionName: "Comments",
        foreignFieldName: "postId",
        filterFn: (comment) => !comment.deleted && !comment.parentCommentId,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Comments",
        foreignFieldName: "postId",
        filterFn: (comment) => !comment.deleted && !comment.parentCommentId,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  recentComments: {
    graphql: {
      outputType: "[Comment]",
      canRead: ["guests"],
      arguments: "commentsLimit: Int, maxAgeHours: Int, af: Boolean",
      resolver: async (post, args, context) => {
        const { commentsLimit, maxAgeHours = 18, af = false } = args;
        const { currentUser, Comments } = context;
        const oneHourInMs = 60 * 60 * 1000;
        const lastCommentedOrNow = post.lastCommentedAt ?? new Date();
        const timeCutoff = new Date(lastCommentedOrNow.getTime() - maxAgeHours * oneHourInMs);
        const loaderName = af ? "recentCommentsAf" : "recentComments";
        const filter = {
          ...getDefaultViewSelector("Comments"),
          score: { $gt: 0 },
          deletedPublic: false,
          postedAt: { $gt: timeCutoff },
          ...(af ? { af: true } : {}),
          ...(isLWorAF ? { userId: { $ne: reviewUserBotSetting.get() } } : {}),
        };
        const comments = await getWithCustomLoader(context, loaderName, post._id, (postIds) => {
          return context.repos.comments.getRecentCommentsOnPosts(postIds, commentsLimit ?? 5, filter);
        });
        return await accessFilterMultiple(currentUser, "Comments", comments, context);
      },
    },
  },
  languageModelSummary: {
    graphql: {
      outputType: "String!",
      canRead: ["admins"],
      resolver: async (post, _args, context) => {
        if (!post.contents_latest) {
          return "";
        }
        const postWithContents = await fetchFragmentSingle({
          collectionName: "Posts",
          fragmentName: "PostsOriginalContents",
          selector: {
            _id: post._id,
          },
          currentUser: context.currentUser,
          context,
        });
        if (!postWithContents?.contents?.originalContents) {
          return "";
        }
        const markdownPostBody = dataToMarkdown(
          postWithContents.contents?.originalContents?.data,
          postWithContents.contents?.originalContents?.type
        );
        const authorName = "Authorname"; //TODO
        return await languageModelGenerateText({
          taskName: "summarize",
          inputs: {
            title: post.title,
            author: authorName,
            text: markdownPostBody,
          },
          maxTokens: 1000,
          context,
        });
      },
    },
  },
  debate: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["debaters", "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  collabEditorDialogue: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  totalDialogueResponseCount: {
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
      resolver: async (post, _, context) => {
        if (!post.debate) return 0;
        const responseIds = await getDialogueResponseIds(post, context);
        return responseIds.length;
      },
    },
  },
  mostRecentPublishedDialogueResponseDate: {
    database: {
      type: "TIMESTAMPTZ",
      denormalized: true,
      canAutoDenormalize: true,
      getValue: hxrFo8,
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: getDenormalizedFieldOnCreate<"Posts">({ getValue: hxrFo8 }),
      onUpdate: getDenormalizedFieldOnUpdate<"Posts">({ getValue: hxrFo8 }),
      validation: {
        optional: true,
      },
    },
  },
  unreadDebateResponseCount: {
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
      resolver: async (post, _, context) => {
        if (!post.collabEditorDialogue) return 0;
        const lastReadStatus = await getLastReadStatus(post, context);
        if (!lastReadStatus) return 0;
        const messageTimestamps = await getDialogueMessageTimestamps(post, context);
        const newMessageTimestamps = messageTimestamps.filter((ts) => ts > lastReadStatus.lastUpdated);
        return newMessageTimestamps.length ?? 0;
      },
    },
  },
  emojiReactors: {
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      resolver: async (post, _, context) => {
        const { extendedScore } = post;
        if (!isEAForum || !extendedScore || Object.keys(extendedScore).length < 1 || "agreement" in extendedScore) {
          return {};
        }
        const reactors = await context.repos.posts.getPostEmojiReactorsWithCache(post._id);
        return reactors ?? {};
      },
    },
  },
  commentEmojiReactors: {
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      resolver: (post, _, context) => {
        if (post.votingSystem !== "eaEmojis") {
          return null;
        }
        return context.repos.posts.getCommentEmojiReactorsWithCache(post._id);
      },
    },
  },
  rejected: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  rejectedReason: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  rejectedByUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      onUpdate: ({ modifier, document, currentUser }) => {
        if (modifier.$set?.rejected && currentUser) {
          return modifier.$set.rejectedByUserId || currentUser._id;
        }
      },
      validation: {
        optional: true,
      },
    },
  },
  rejectedByUser: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "rejectedByUserId" }),
    },
  },
  dialogTooltipPreview: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: async (post, _, context) => {
        if (!post.debate) return null;
        const { Comments } = context;
        const firstComment = await Comments.findOne(
          {
            ...getDefaultViewSelector("Comments"),
            postId: post._id,
            // This actually forces `deleted: false` by combining with the default view selector
            deletedPublic: false,
            debateResponse: true,
          },
          {
            sort: {
              postedAt: 1,
            },
          }
        );
        if (!firstComment) return null;
        return firstComment.contents?.html;
      },
    },
  },
  dialogueMessageContents: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      arguments: "dialogueMessageId: String",
      resolver: async (post, args, context) => {
        const { currentUser } = context;
        const { dialogueMessageId } = args;
        if (!post.collabEditorDialogue) return null;
        if (!dialogueMessageId) return null;
        if (!currentUser) return null;
        const isParticipant = isDialogueParticipant(currentUser._id, post);
        if (!isParticipant) return null;
        const html =
          (await getLatestRev(post._id, "contents"))?.html ??
          (await getLatestContentsRevision(post, context))?.html ??
          "";
        const $ = cheerioParse(html);
        const message = $(`[message-id="${dialogueMessageId}"]`);
        return message.html();
      },
    },
  },
  firstVideoAttribsForPreview: {
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        const videoHosts = ["https://www.youtube.com", "https://youtube.com", "https://youtu.be"];
        const html = await getPostHTML(post, context);
        const $ = cheerioParse(html);
        const iframes = $("iframe").toArray();
        for (const iframe of iframes) {
          if ("attribs" in iframe) {
            const src = iframe.attribs.src ?? "";
            for (const host of videoHosts) {
              if (src.indexOf(host) === 0) {
                return iframe.attribs;
              }
            }
          }
        }
        return null;
      },
    },
  },
  subforumTagId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Tags",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  subforumTag: {
    graphql: {
      outputType: "Tag",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Tags", fieldName: "subforumTagId" }),
    },
  },
  af: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["alignmentForum"],
      canCreate: ["alignmentForum"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 10,
      label: "Alignment Forum",
      control: "checkbox",
      group: () => formGroups.advancedOptions,
    },
  },
  afDate: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: ["alignmentForum"],
      canCreate: ["alignmentForum"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      label: "Alignment Forum",
      group: () => formGroups.advancedOptions,
    },
  },
  afCommentCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Posts",
        fieldName: "afCommentCount",
        foreignCollectionName: "Comments",
        foreignFieldName: "postId",
        filterFn: (comment) => comment.af && !comment.deleted && !comment.debateResponse,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Comments",
        foreignFieldName: "postId",
        filterFn: (comment) => comment.af && !comment.deleted && !comment.debateResponse,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Alignment Comment Count",
    },
  },
  afLastCommentedAt: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
      validation: {
        optional: true,
      },
    },
  },
  afSticky: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["alignmentForumAdmins", "admins"],
      canCreate: ["alignmentForumAdmins", "admins"],
      onCreate: ({ document: post }) => {
        if (!post.afSticky) {
          return false;
        }
      },
      onUpdate: ({ modifier }) => {
        if (!(modifier.$set && modifier.$set.afSticky)) {
          return false;
        }
      },
      validation: {
        optional: true,
      },
    },
    form: {
      order: 10,
      label: "Sticky (Alignment)",
      control: "checkbox",
      hidden: isEAForum,
      group: () => formGroups.adminOptions,
    },
  },
  suggestForAlignmentUserIds: {
    database: {
      type: "TEXT[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[String]",
      canRead: ["members"],
      canUpdate: ["members", "alignmentForum", "alignmentForumAdmins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
      onCreate: arrayOfForeignKeysOnCreate,
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      label: "Suggested for Alignment by",
      control: "FormUserMultiselect",
      group: () => formGroups.adminOptions,
    },
  },
  suggestForAlignmentUsers: {
    graphql: {
      outputType: "[User!]!",
      canRead: ["members"],
      resolver: generateIdResolverMulti({ foreignCollectionName: "Users", fieldName: "suggestForAlignmentUserIds" }),
    },
  },
  reviewForAlignmentUserId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["alignmentForumAdmins", "admins"],
      canCreate: ["alignmentForumAdmins", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "AF Review UserId",
      hidden: isEAForum,
      group: () => formGroups.adminOptions,
    },
  },
  agentFoundationsId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  swrCachingEnabled: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "stale-while-revalidate caching enabled",
      group: () => formGroups.adminOptions,
    },
  },
  generateDraftJargon: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["members"],
      canUpdate: [userOwns, "admins"],
      validation: {
        optional: true,
      },
    },
  },
  curationNotices: {
    graphql: {
      outputType: "[CurationNotice]",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        const { currentUser, CurationNotices } = context;
        const curationNotices = await CurationNotices.find({
          postId: post._id,
          deleted: {
            $ne: true,
          },
        }).fetch();
        return await accessFilterMultiple(currentUser, "CurationNotices", curationNotices, context);
      },
    },
  },
  reviews: {
    graphql: {
      outputType: "[Comment]",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        const { currentUser, Comments } = context;
        const reviews = await getWithCustomLoader(context, "postReviews", post._id, (postIds) =>
          context.repos.comments.getPostReviews(postIds, 2, 10)
        );
        return await accessFilterMultiple(currentUser, "Comments", reviews, context);
      },
    },
  },
  currentUserVote: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        const votes = await getCurrentUserVotes(document, context);
        if (!votes.length) return null;
        return votes[0].voteType ?? null;
      },
      sqlResolver: currentUserVoteResolver,
    },
  },
  currentUserExtendedVote: {
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        const votes = await getCurrentUserVotes(document, context);
        if (!votes.length) return null;
        return votes[0].extendedVoteType || null;
      },
      sqlResolver: currentUserExtendedVoteResolver,
    },
  },
  currentUserVotes: {
    graphql: {
      outputType: "[Vote]",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        return await getCurrentUserVotes(document, context);
      },
    },
  },
  allVotes: {
    graphql: {
      outputType: "[Vote]",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        const { currentUser } = context;
        if (userIsAdminOrMod(currentUser)) {
          return await getAllVotes(document, context);
        } else {
          return await getCurrentUserVotes(document, context);
        }
      },
    },
  },
  voteCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Posts",
        fieldName: "voteCount",
        foreignCollectionName: "Votes",
        foreignFieldName: "documentId",
        filterFn: (vote) => !vote.cancelled && vote.voteType !== "neutral" && vote.collectionName === "Posts",
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Votes",
        foreignFieldName: "documentId",
        filterFn: (vote) => !vote.cancelled && vote.voteType !== "neutral" && vote.collectionName === "Posts",
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  baseScore: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  extendedScore: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  score: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  inactive: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
  },
  afBaseScore: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Alignment Base Score",
    },
  },
  afExtendedScore: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  afVoteCount: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"Posts">>;

export default schema;
