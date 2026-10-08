import { type ForumTypeString, hideUnreviewedAuthorCommentsSettings, siteUrlSetting } from '@/lib/instanceSettings';
import { combineUrls } from '../../vulcan-lib/utils';
import { postGetPageUrl } from '../posts/helpers';
import { userCanDo } from '../../vulcan-users/permissions';
import { userGetDisplayName } from "../users/helpers";
import { tagGetCommentLink } from '../tags/helpers';
import { TagCommentType } from './types';
import { forumSelect } from '../../forumTypeUtils';

// Get a comment author's name
export async function commentGetAuthorName(comment: DbComment, context: ResolverContext): Promise<string> {
  var user = await context.Users.findOne({_id: comment.userId});
  return user ? userGetDisplayName(user, context.forumType) : comment.author ?? "[unknown author]";
};

// Get the relative URL of a comment page, loading its parent through context.
export async function commentGetPageUrlFromDB(comment: DbComment, context: ResolverContext): Promise<string> {
  if (comment.postId) {
    const post = await context.loaders.Posts.load(comment.postId);
    if (!post) throw Error(`Unable to find post for comment: ${comment._id}`)
    return `${postGetPageUrl(post)}?commentId=${comment._id}`;
  } else if (comment.tagId) {
    const tag = await context.loaders.Tags.load(comment.tagId);
    if (!tag) throw Error(`Unable to find wikitag for comment: ${comment._id}`)

    return tagGetCommentLink({tagSlug: tag.slug, commentId: comment._id, tagCommentType: comment.tagCommentType});
  } else {
    throw Error(`Unable to find document for comment: ${comment._id}`)
  }
};

export function commentGetPageUrl(comment: CommentsListWithParentMetadata): string {
  if (comment.post) {
    return `${postGetPageUrl(comment.post)}?commentId=${comment._id}`;
  } else if (comment.tag) {
    return tagGetCommentLink({tagSlug: comment.tag.slug, commentId: comment._id, tagCommentType: comment.tagCommentType});
  } else {
    throw new Error(`Unable to find document for comment: ${comment._id}`);
  }
}

export async function commentGetAbsolutePageUrlFromDB(comment: DbComment, context: ResolverContext): Promise<string> {
  const relativeUrl = await commentGetPageUrlFromDB(comment, context);
  return combineUrls(siteUrlSetting.get(context), relativeUrl);
}

export function commentGetAbsolutePageUrl(comment: CommentsListWithParentMetadata, forumType: ForumTypeString): string {
  return combineUrls(siteUrlSetting.get(forumType), commentGetPageUrl(comment));
}

interface CommentPageUrlOptions {
  postId?: string | null,
  postSlug?: string | null,
  tagSlug?: string | null,
  tagCommentType?: TagCommentType | null,
  commentId?: string | null,
  permalink?: boolean,
}

// TODO there are several functions which do this, some of them should be combined
export function commentGetPageUrlFromIds({postId, postSlug, tagSlug, tagCommentType, commentId, permalink=true}: CommentPageUrlOptions): string {
  if (postId) {
    if (permalink) {
      return `/posts/${postId}/${postSlug?postSlug:""}?commentId=${commentId}`;
    } else {
      return `/posts/${postId}/${postSlug?postSlug:""}#${commentId}`;
    }
  } else if (tagSlug) {
    return tagGetCommentLink({tagSlug, commentId, tagCommentType: tagCommentType ?? "DISCUSSION"});
  } else {
    //throw new Error("commentGetPageUrlFromIds needs a post or tag");
    return "/"
  }
}

export function commentGetAbsolutePageUrlFromIds(options: CommentPageUrlOptions, forumType: ForumTypeString): string {
  if (!options.postId && !options.tagSlug) return "/";
  return combineUrls(siteUrlSetting.get(forumType), commentGetPageUrlFromIds(options));
}

// URL for RSS feed of all direct replies
export const commentGetRSSUrl = function(comment: HasIdType): string {
  return `/feed.xml?type=comments&view=commentReplies&parentCommentId=${comment._id}`;
};

export const commentGetAbsoluteRSSUrl = function(comment: HasIdType, forumType: ForumTypeString): string {
  return combineUrls(siteUrlSetting.get(forumType), commentGetRSSUrl(comment));
};

export const commentDefaultToAlignment = (currentUser: UsersCurrent|null, post: PostsMinimumInfo|undefined, forumType: ForumTypeString, comment?: CommentsList): boolean => {
  if (forumType === 'AlignmentForum') { return true }
  if (comment) {
    return !!(userCanDo(currentUser, "comments.alignment.new") && post?.af && comment.af)
  } else {
    return !!(userCanDo(currentUser, "comments.alignment.new") && post?.af)
  }
}

export const commentGetDefaultView = (post: PostsDetails|PostsList|DbPost|null, currentUser: UsersCurrent|null, forumType: ForumTypeString): CommentsViewName => {
  const fallback = forumSelect({
    AlignmentForum: "afPostCommentsTop",
    EAForum: "postCommentsMagic",
    default: "postCommentsTop",
  }, forumType);
  const postSortOrder = (post && 'commentSortOrder' in post) ? post.commentSortOrder : null;
  return (postSortOrder as CommentsViewName)
    || (currentUser?.commentSorting as CommentsViewName)
    || fallback;
}

export const commentGetKarma = (comment: CommentsList|DbComment, forumType: ForumTypeString): number => {
  const baseScore = forumType === 'AlignmentForum' ? comment.afBaseScore : comment.baseScore
  return baseScore || 0
}

export const commentAllowTitle = (comment: {tagCommentType?: TagCommentType, parentCommentId?: string | null}): boolean => comment?.tagCommentType === 'SUBFORUM' && !comment?.parentCommentId

/**
 * If the site is currently hiding comments by unreviewed authors, check if we need to hide this comment.
 */
export const commentIsHiddenPendingReview = (comment: CommentsList|DbComment, forumType: ForumTypeString) => {
  const hideSince = hideUnreviewedAuthorCommentsSettings.get(forumType)
  const postedAfterGrandfatherDate = hideSince && new Date(hideSince) < new Date(comment.postedAt) 
  // hide unreviewed comments which were posted after we implmemented a "all comments need to be reviewed" date
  return postedAfterGrandfatherDate && comment.authorIsUnreviewed
}

export const commentIsNotPublicForAnyReason = (comment: CommentsList|DbComment, forumType: ForumTypeString) => {
  if (comment.draft || comment.deleted || comment.rejected) {
    return true;
  }

  return commentIsHiddenPendingReview(comment, forumType);
}

export const commentIncludedInCounts = (comment: Pick<DbComment, '_id' | 'deleted' | 'rejected' | 'debateResponse' | 'authorIsUnreviewed' | 'draft'>) => (
  !comment.deleted &&
  !comment.rejected &&
  !comment.debateResponse &&
  !comment.authorIsUnreviewed &&
  !comment.draft
);

export async function getVotingSystemNameForDocument(document: VoteableType, collectionName: VoteableCollectionName, context: ResolverContext): Promise<string> {
  if (collectionName === "MultiDocuments" || collectionName === "Tags") {
    return "reactionsAndLikes";
  }
  if (collectionName === "Messages") {
    return "namesAttachedReactions";
  }
  if ((document as DbComment).tagId) {
    return "namesAttachedReactions";
  }
  if ((document as DbComment).postId) {
    const post = await context.loaders.Posts.load((document as DbComment).postId!);
    if (post?.votingSystem) {
      return post.votingSystem;
    }
  }
  return (document as DbPost)?.votingSystem ?? "default";
}
