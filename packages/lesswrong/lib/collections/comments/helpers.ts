import { forumTypeSetting, taggingNameSetting } from '../../instanceSettings';
import { getSiteUrl } from '../../vulcan-lib/utils';
import { mongoFindOne } from '../../mongoQueries';
import { postGetPageUrl } from '../posts/helpers';
import { userCanDo } from '../../vulcan-users/permissions';
import { userGetDisplayName } from "../users/helpers";
import { tagGetCommentLink } from '../tags/helpers';
import { TagCommentType } from './types';
import { hideUnreviewedAuthorCommentsSettings } from '../../publicSettings';
import { forumSelect } from '../../forumTypeUtils';

// Get a comment author's name
export async function commentGetAuthorName(comment: DbComment): Promise<string> {
  var user = await mongoFindOne("Users", comment.userId);
  return user ? userGetDisplayName(user) : comment.author;
};

export const COMMENT_PAGE_URL_FIELDS = ['_id', 'postId', 'tagId', 'tagCommentType'] as const;
export type CommentPageUrlFields = Pick<DbComment, typeof COMMENT_PAGE_URL_FIELDS[number]>;

// Get URL of a comment page.
export async function commentGetPageUrlFromDB(comment: CommentPageUrlFields, context: ResolverContext, isAbsolute: boolean): Promise<string> {
  if (comment.postId) {
    const post = await context.loaders.Posts.load(comment.postId);
    if (!post) throw Error(`Unable to find post for comment: ${comment._id}`)
    return `${postGetPageUrl(post, isAbsolute)}?commentId=${comment._id}`;
  } else if (comment.tagId) {
    const tag = await context.loaders.Tags.load(comment.tagId);
    if (!tag) throw Error(`Unable to find ${taggingNameSetting.get()} for comment: ${comment._id}`)

    return tagGetCommentLink({tagSlug: tag.slug, commentId: comment._id, tagCommentType: comment.tagCommentType, isAbsolute});
  } else {
    throw Error(`Unable to find document for comment: ${comment._id}`)
  }
};

export function commentGetPageUrl(comment: CommentsListWithParentMetadata, isAbsolute = false): string {
  if (comment.post) {
    return `${postGetPageUrl(comment.post, isAbsolute)}?commentId=${comment._id}`;
  } else if (comment.tag) {
    return tagGetCommentLink({tagSlug: comment.tag.slug, commentId: comment._id, tagCommentType: comment.tagCommentType, isAbsolute});
  } else {
    throw new Error(`Unable to find document for comment: ${comment._id}`);
  }
}

// TODO there are several functions which do this, some of them should be combined
export function commentGetPageUrlFromIds({postId, postSlug, tagSlug, tagCommentType, commentId, permalink=true, isAbsolute=false}: {
  postId?: string,
  postSlug?: string,
  tagSlug?: string,
  tagCommentType?: TagCommentType,
  commentId: string,
  permalink?: boolean, isAbsolute?: boolean,
}): string {
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';

  if (postId) {
    if (permalink) {
      return `${prefix}/posts/${postId}/${postSlug?postSlug:""}?commentId=${commentId}`;
    } else {
      return `${prefix}/posts/${postId}/${postSlug?postSlug:""}#${commentId}`;
    }
  } else if (tagSlug) {
    return tagGetCommentLink({tagSlug, commentId, tagCommentType: tagCommentType ?? "DISCUSSION", isAbsolute});
  } else {
    //throw new Error("commentGetPageUrlFromIds needs a post or tag");
    return "/"
  }
}

// URL for RSS feed of all direct replies
export const commentGetRSSUrl = function(comment: HasIdType, isAbsolute = false): string {
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';
  return `${prefix}/feed.xml?type=comments&view=commentReplies&parentCommentId=${comment._id}`;
};

export const commentDefaultToAlignment = (currentUser: UsersCurrent|null, post: PostsMinimumInfo|undefined, comment?: CommentsList): boolean => {
  if (forumTypeSetting.get() === 'AlignmentForum') { return true }
  if (comment) {
    return !!(userCanDo(currentUser, "comments.alignment.new") && post?.af && comment.af)
  } else {
    return !!(userCanDo(currentUser, "comments.alignment.new") && post?.af)
  }
}

export const commentGetDefaultView = (post: PostsDetails|DbPost|null, currentUser: UsersCurrent|null): CommentsViewName => {
  const fallback = forumSelect({
    AlignmentForum: "afPostCommentsTop",
    EAForum: "postCommentsMagic",
    default: "postCommentsTop",
  });
  return (post?.commentSortOrder as CommentsViewName) || (currentUser?.commentSorting as CommentsViewName) || fallback
}

export const commentGetKarma = (comment: CommentsList|DbComment): number => {
  const baseScore = forumTypeSetting.get() === 'AlignmentForum' ? comment.afBaseScore : comment.baseScore
  return baseScore || 0
}

export const commentAllowTitle = (comment: {tagCommentType: TagCommentType, parentCommentId?: string}): boolean => comment?.tagCommentType === 'SUBFORUM' && !comment?.parentCommentId

/**
 * If the site is currently hiding comments by unreviewed authors, check if we need to hide this comment.
 */
export const commentIsHidden = (comment: CommentsList|DbComment) => {
  const hideSince = hideUnreviewedAuthorCommentsSettings.get()
  const postedAfterGrandfatherDate = hideSince && new Date(hideSince) < new Date(comment.postedAt) 
  // hide unreviewed comments which were posted after we implmemented a "all comments need to be reviewed" date
  return postedAfterGrandfatherDate && comment.authorIsUnreviewed
}
