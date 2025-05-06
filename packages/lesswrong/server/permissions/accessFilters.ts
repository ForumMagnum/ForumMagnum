import { userCanUseTags } from "@/lib/betas";
import { getRootDocument } from "@/lib/collections/multiDocuments/helpers";
import { accessLevelCan, getCollaborativeEditorAccess, getSharingKeyFromContext } from "@/lib/collections/posts/collabEditingPermissions";
import { postStatusLabels } from "@/lib/collections/posts/constants";
import { userIsPostGroupOrganizer } from "@/lib/collections/posts/helpers";
import { subscriptionTypes } from "@/lib/collections/subscriptions/helpers";
import { userIsSharedOn } from "@/lib/collections/users/helpers";
import { extractVersionsFromSemver } from "@/lib/editor/utils";
import { constantTimeCompare } from "@/lib/helpers";
import { userCanDo, userIsAdmin, userIsAdminOrMod, userOwns } from "@/lib/vulcan-users/permissions";
import _ from "underscore";

const automatedContentEvaluationCheckAccess: CheckAccessFunction<'AutomatedContentEvaluations'> = async (currentUser, document, context): Promise<boolean> => {
  if (!currentUser || !document) return false;
  return currentUser.isAdmin
};

const banCheckAccess: CheckAccessFunction<'Bans'> = async (currentUser, document, context): Promise<boolean> => {
  if (!currentUser || !document) return false;
  return userCanDo(currentUser, 'bans.view')
};

const chapterCheckAccess: CheckAccessFunction<'Chapters'> = async (currentUser, document, context): Promise<boolean> => {
  if (!document) return false;
  // Since chapters have no userIds there is no obvious way to check for permissions.
  // We might want to check the parent sequence, but that seems too costly, so for now just be permissinve
  return true
};

const clientIdCheckAccess: CheckAccessFunction<'ClientIds'> = async (currentUser, document, context): Promise<boolean> => {
  return currentUser?.isAdmin ?? false;
}

const conversationCheckAccess: CheckAccessFunction<'Conversations'> = async (currentUser, document, context): Promise<boolean> => {
  if (!currentUser || !document) return false;
  return document.participantIds?.includes(currentUser._id)
    ? userCanDo(currentUser, 'conversations.view.own')
    : userCanDo(currentUser, `conversations.view.all`);
};

const curationNoticeCheckAccess: CheckAccessFunction<'CurationNotices'> = async (currentUser, document, context): Promise<boolean> => {
  return userIsAdminOrMod(currentUser);
};

const dialogueCheckCheckAccess: CheckAccessFunction<'DialogueChecks'> = async (currentUser, document, context): Promise<boolean> => {
  const { DialogueChecks } = context;

  // Case 1: A user can see their own checks
  if (document.userId === currentUser?._id) {
    return true;
  }

  // Case 2: A user can see the checks of people they themselves have checked... 
  const outgoingCheck = await DialogueChecks.findOne({ userId: currentUser?._id, targetUserId: document.userId, checked: true });
  // ...but only the checks concerning themselves
  const targetOfOtherCheck = (document.targetUserId === currentUser?._id)
  if (outgoingCheck && targetOfOtherCheck) {
    return true;
  }

  // If none of the above conditions are met, deny access
  return false;
};

const dialogueMatchPreferenceCheckAccess: CheckAccessFunction<'DialogueMatchPreferences'> = async (currentUser, document, context): Promise<boolean> => {
  const { loaders } = context;

  if (!currentUser) {
    return false;
  }

  // Users can see their own preferences
  const dialogueCheck = await loaders.DialogueChecks.load(document.dialogueCheckId);
  
  if (dialogueCheck?.userId === currentUser._id || dialogueCheck?.targetUserId === currentUser._id) {
    return true;
  }

  return false;
};

const jargonTermCheckAccess: CheckAccessFunction<'JargonTerms'> = async (currentUser, document, context): Promise<boolean> => {
  const post = await context.loaders.Posts.load(document.postId);

  if (!post) {
    return false;
  }

  // If a user has read access to the post, they have read access to any jargon terms for that post
  return await postCheckAccess(currentUser, post, context);
};

const llmConversationCheckAccess: CheckAccessFunction<'LlmConversations'> = async (currentUser, document, context): Promise<boolean> => {
  return userIsAdmin(currentUser) || userOwns(currentUser, document);
};

const llmMessageCheckAccess: CheckAccessFunction<'LlmMessages'> = async (currentUser, document, context): Promise<boolean> => {
  return userIsAdmin(currentUser) || userOwns(currentUser, document);
};

const lweventCheckAccess: CheckAccessFunction<'LWEvents'> = async (currentUser, document, context): Promise<boolean> => {
  if (!currentUser || !document) return false;
  if (document.name === "gatherTownUsersCheck") return true;

  return userOwns(currentUser, document)
    ? userCanDo(currentUser, 'events.view.own')
    : userCanDo(currentUser, `events.view.all`);
};

const messageCheckAccess: CheckAccessFunction<'Messages'> = async (currentUser, document, context): Promise<boolean> => {
  const { Conversations } = context;

  if (!currentUser || !document) return false;

  return (await Conversations.findOne({_id: document.conversationId}))?.participantIds?.includes(currentUser._id)
    ? userCanDo(currentUser, 'messages.view.own')
    : userCanDo(currentUser, `messages.view.all`);
};

const multiDocumentCheckAccess: CheckAccessFunction<'MultiDocuments'> = async (currentUser, document, context, outReasonDenied): Promise<boolean> => {
  if (userIsAdmin(currentUser)) {
    return true;
  }

  const rootDocumentInfo = await getRootDocument(document, context);
  if (!rootDocumentInfo) {
    return false;
  }

  const { document: rootDocument, parentCollectionName } = rootDocumentInfo;
  const parentAccessFilter = getCollectionAccessFilter(parentCollectionName);

  if (parentAccessFilter) {
    const canAccessParent = await parentAccessFilter(currentUser, rootDocument, context, outReasonDenied);
    if (!canAccessParent) {
      return false;
    }
  }

  return true;
};

const notificationCheckAccess: CheckAccessFunction<'Notifications'> = async (currentUser, document, context): Promise<boolean> => {
  if (!currentUser || !document) return false;
  return userOwns(currentUser, document)
    ? userCanDo(currentUser, 'notifications.view.own')
    : userCanDo(currentUser, `conversations.view.all`);
};

const postCheckAccess: CheckAccessFunction<'Posts'> = async (currentUser, post, context, outReasonDenied): Promise<boolean> => {
  const canonicalLinkSharingKey = post.linkSharingKey;
  const unvalidatedLinkSharingKey = getSharingKeyFromContext(context);

  if (post.onlyVisibleToLoggedIn && !currentUser) {
    if (outReasonDenied)
      outReasonDenied.reason = "This post is only visible to logged-in users.";
    return false;
  }
  if (userCanDo(currentUser, 'posts.view.all')) {
    return true
  } else if (userOwns(currentUser, post) || userIsSharedOn(currentUser, post) || await userIsPostGroupOrganizer(currentUser, post, context)) {
    return true;
  } else if (!currentUser && !!canonicalLinkSharingKey && constantTimeCompare({ correctValue: canonicalLinkSharingKey, unknownValue: unvalidatedLinkSharingKey })) {
    return true;
  } else if (post.isFuture || post.draft || post.deletedDraft) {
    return false;
    // TODO: consider getting rid of this clause entirely and instead just relying on default view filter, 
    // since LW is now allowing people to see rejected content and preventing them from seeing 'not-yet-rejected
    // content is kinda weird)
  } else if (post.authorIsUnreviewed && !post.rejected) {
    return false
  } else {
    const status = _.findWhere(postStatusLabels, {value: post.status});
    if (!status) return false;
    return userCanDo(currentUser, `posts.view.${status.label}`);
  }
};

const reportCheckAccess: CheckAccessFunction<'Reports'> = async (currentUser, document, context): Promise<boolean> => {
  if (!currentUser || !document) return false;
  return (
    document.userId === currentUser._id
      ? userCanDo(currentUser, 'reports.view.own')
      : userCanDo(currentUser, `reports.view.all`)
  );
};

const reviewVoteCheckAccess: CheckAccessFunction<'ReviewVotes'> = async (currentUser, document, context): Promise<boolean> => {
  if (!currentUser || !document) return false;
  return (
    document.userId === currentUser._id
      ? userCanDo(currentUser, 'reviewVotes.view.own')
      : userCanDo(currentUser, `reviewVotes.view.all`)
  );
};

// Note, since we want to make sure checkAccess is a performant function, we can only check the 
// userId of the current revision for ownership. If the userId of the document the revision is on,
// and the revision itself differ (e.g. because an admin has made the edit, or a coauthor), then
// we will hide those revisions unless they are marked as post-1.0.0 releases. This is not ideal, but
// seems acceptable
const revisionCheckAccess: CheckAccessFunction<'Revisions'> = async (currentUser, revision, context): Promise<boolean> => {
  if (!revision) return false
  if ((currentUser && currentUser._id) === revision.userId) return true
  if (userCanDo(currentUser, 'posts.view.all')) return true
  
  // not sure why some revisions have no collectionName,
  // but this will cause an error below so just exclude them
  if (!revision.collectionName) return false

  const collectionName = revision.collectionName;
  if (collectionName === "CurationNotices") return false

  // Get the document that this revision is a field of, and check for access to
  // it. This is necessary for correctly handling things like posts' draft
  // status and sharing settings.
  //
  // We might or might not have a ResolverContext (because some places, like
  // email-sending, don't have one). If we do, use its loader; in the typical
  // case, this will hit in the cache 100% of the time. If we don't have a
  // ResolverContext, use a findOne query; this is slow, but doesn't come up
  // in any contexts where speed matters.
  const { major: majorVersion } = extractVersionsFromSemver(revision.version)
  const documentId = revision.documentId;

  if (!documentId) {
    return false
  }
  
  const document = await context.loaders[collectionName].load(documentId);

  // This shouldn't happen, but `collection.findOne` has a type signature that returns null, and technically we don't enforce data consistency such that it's strictly impossible
  if (!document) {
    return false;
  }
  
  if (revision.collectionName === "Posts") {
    const collabEditorAccess = await getCollaborativeEditorAccess({
      formType: "edit",
      post: document as DbPost,
      user: currentUser,
      useAdminPowers: true,
      context
    });
    if (accessLevelCan(collabEditorAccess, "read")) {
      return true;
    }
  }

  // JargonTerms are often created by an admin bot account, and by default would not be visible to post authors
  // so we need to check read access to the post itself
  if (collectionName === "JargonTerms") {
    const postId = (document as DbJargonTerm).postId;
    const post = await context.loaders.Posts.load(postId);

    if (!post) {
      return false;
    }

    return await postCheckAccess(currentUser, post, context);
  }
  
  
  if (revision.draft) {
    return false;
  }
  
  // Everyone who can see the post can get access to non-draft revisions
  const parentAccessFilter = getCollectionAccessFilter(collectionName as keyof typeof accessFilters);
  if (!document || (parentAccessFilter && !(await parentAccessFilter(currentUser, document as AnyBecauseHard, context)))) {
    return false;
  }
  
  return true;
}

const sequenceCheckAccess: CheckAccessFunction<'Sequences'> = async (currentUser, document, context): Promise<boolean> => {
  if (!document || document.isDeleted) {
    return false;
  }
  
  // If it isn't a draft, it's public
  if (!document.draft) {
    return true;
  }
  
  if (!currentUser) {
    return false;
  }
  
  if (userOwns(currentUser, document)) {
    return true;
  } else if (userCanDo(currentUser, `sequences.view.all`)) {
    return true;
  } else {
    return false;
  }
}

const sessionCheckAccess: CheckAccessFunction<'Sessions'> = async (_user, _session, _context, outReasonDenied): Promise<boolean> => {
  if (outReasonDenied) {
    outReasonDenied.reason = "Sessions cannot be accessed manually";
  }
  return false;
}

const subscriptionCheckAccess: CheckAccessFunction<'Subscriptions'> = async (currentUser, subscription, context): Promise<boolean> => {
  const { loaders } = context;
  if (!currentUser) return false;
  if (subscription.userId === currentUser._id) return true;
  if (userIsAdmin(currentUser)) return true;
  
  // If this subscription is to a LocalGroup, organizers of that group can see
  // the subscription
  if (subscription.type === subscriptionTypes.newEvents && subscription.documentId) {
    const localGroup = await loaders.Localgroups.load(subscription.documentId);
    if (localGroup?.organizerIds.includes(currentUser._id)) {
      return true;
    }
  }
  
  return false;
}

const tagRelCheckAccess: CheckAccessFunction<'TagRels'> = async (currentUser, tagRel, context): Promise<boolean> => {
  if (userCanUseTags(currentUser)) return true;
  return !tagRel.deleted;
}

const tagCheckAccess: CheckAccessFunction<'Tags'> = async (currentUser, tag, context): Promise<boolean> => {
  if (userIsAdmin(currentUser)) return true;
  return !tag.deleted;
}

const typingIndicatorCheckAccess: CheckAccessFunction<'TypingIndicators'> = async (currentUser, document, context): Promise<boolean> => {
  // no access here via GraphQL API. Instead, access via direct database query inside server sent event logic
  return false
};

const userTagRelCheckAccess: CheckAccessFunction<'UserTagRels'> = async (currentUser, userTagRel, context): Promise<boolean> => {
  if (userIsAdmin(currentUser) || userOwns(currentUser, userTagRel)) { // admins can always see everything, users can always see their own settings
    return true;
  } else {
    return false;
  }
}

const userCheckAccess: CheckAccessFunction<'Users'> = async (currentUser, document, context): Promise<boolean> => {
  if (document && document.deleted && !userOwns(currentUser, document)) return userCanDo(currentUser, 'users.view.deleted')
  return true
};

const voteCheckAccess: CheckAccessFunction<'Votes'> = async (currentUser, vote, context): Promise<boolean> => {
  if (!currentUser) return false;
  return (vote.userId===currentUser._id || userIsAdminOrMod(currentUser));
}

const accessFilters = {
  AutomatedContentEvaluations: automatedContentEvaluationCheckAccess,
  Bans: banCheckAccess,
  Chapters: chapterCheckAccess,
  ClientIds: clientIdCheckAccess,
  Conversations: conversationCheckAccess,
  CurationNotices: curationNoticeCheckAccess,
  DialogueChecks: dialogueCheckCheckAccess,
  DialogueMatchPreferences: dialogueMatchPreferenceCheckAccess,
  JargonTerms: jargonTermCheckAccess,
  LlmConversations: llmConversationCheckAccess,
  LlmMessages: llmMessageCheckAccess,
  LWEvents: lweventCheckAccess,
  Messages: messageCheckAccess,
  MultiDocuments: multiDocumentCheckAccess,
  Notifications: notificationCheckAccess,
  Posts: postCheckAccess,
  Reports: reportCheckAccess,
  ReviewVotes: reviewVoteCheckAccess,
  Revisions: revisionCheckAccess,
  Sequences: sequenceCheckAccess,
  Sessions: sessionCheckAccess,
  Subscriptions: subscriptionCheckAccess,
  TagRels: tagRelCheckAccess,
  Tags: tagCheckAccess,
  TypingIndicators: typingIndicatorCheckAccess,
  UserTagRels: userTagRelCheckAccess,
  Users: userCheckAccess,
  Votes: voteCheckAccess,
} satisfies Partial<Record<CollectionNameString, CheckAccessFunction<CollectionNameString>>>;

function collectionHasAccessFilter<N extends CollectionNameString>(collectionName: N): collectionName is (N & keyof typeof accessFilters) {
  return collectionName in accessFilters;
}

type AccessFunctionForCollection<N extends CollectionNameString> = N extends keyof typeof accessFilters
  ? CheckAccessFunction<N>
  : undefined;

export function getCollectionAccessFilter<N extends CollectionNameString>(collectionName: N): AccessFunctionForCollection<N> {
  if (collectionName in accessFilters) {
    return accessFilters[collectionName as keyof typeof accessFilters] as AccessFunctionForCollection<N>;
  }
  return undefined as AccessFunctionForCollection<N>;
}
